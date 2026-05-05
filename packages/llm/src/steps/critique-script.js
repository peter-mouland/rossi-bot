import { readFile } from 'fs/promises'
import { join } from 'path'
import { getClient } from '../client.js'
import { extractScript } from '../prompts.js'
import { logger } from '@rossi-bot/core-platform'

async function loadExampleScript(avatar) {
  if (!avatar.dir) return null
  try {
    return await readFile(join(avatar.dir, 'example-script.md'), 'utf-8')
  } catch {
    return null
  }
}

// Takes generated scripts and voice rules, returns revised scripts with AI tells removed.
// Uses Haiku for speed and cost — targeted line-level fixes, not rewrites.
export async function critiqueScripts(avatar, videoTypes, scripts) {
  if (!avatar.voiceRules?.length) return scripts

  const client = getClient()
  logger.info(`  Critiquing scripts for: ${avatar.name}`)

  const rulesText = avatar.voiceRules.map((r, i) => `${i + 1}. ${r}`).join('\n')
  const exampleScript = await loadExampleScript(avatar)

  const exampleBlock = exampleScript
    ? `\n## Voice Reference\nThis is an example of the correct voice. Use it to calibrate your edits:\n\n${exampleScript}\n`
    : ''

  const scriptBlocks = Object.entries(scripts)
    .map(([typeId, script]) => `\`\`\`${typeId}\n${script}\n\`\`\``)
    .join('\n\n')

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8096,
    messages: [
      {
        role: 'user',
        content: `You are an editor for ${avatar.name}.

## Voice Rules
${rulesText}
${exampleBlock}
## Scripts to Edit
${scriptBlocks}

## Your Task
Read each script. Find sentences that break any voice rule.
Rewrite only those sentences — leave everything else word-for-word identical.
Output the complete revised scripts in the same fenced block format.`,
      },
    ],
  })

  const textBlock = response.content.find(b => b.type === 'text')
  if (!textBlock) {
    logger.warn('Critique returned no text — using original scripts')
    return scripts
  }

  const revised = {}
  for (const typeId of Object.keys(videoTypes)) {
    const extracted = extractScript(textBlock.text, typeId)
    if (extracted) {
      revised[typeId] = extracted
    } else {
      logger.warn(`Critique did not return a block for "${typeId}" — keeping original`)
      revised[typeId] = scripts[typeId]
    }
  }

  return revised
}
