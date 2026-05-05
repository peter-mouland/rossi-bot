import { readFile } from 'fs/promises'
import { join } from 'path'
import { getClient } from '../client.js'
import { buildAllScriptsPrompt, extractTitle, extractScript, extractNotes } from '../prompts.js'
import { logger } from '@rossi-bot/core-platform'

async function loadExampleScript(avatar) {
  if (!avatar.dir) return null
  try {
    return await readFile(join(avatar.dir, 'example-script.md'), 'utf-8')
  } catch {
    return null
  }
}

// Returns { title, scripts: { teaser, summary, 'deep-dive' } }
// context = { chosenAngle, findings, rawSources? }
// rawSources: toolCalls array from research — when provided, full raw results are added to the prompt
export async function generateScripts(avatar, videoTypes, context) {
  const client = getClient()

  logger.info(`Generating scripts for: ${avatar.name}`)

  const exampleScript = await loadExampleScript(avatar)
  if (exampleScript) logger.debug(`  Using example script for voice reference`)

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 8096,
    system: buildAllScriptsPrompt(avatar, videoTypes, { ...context, exampleScript }),
    messages: [
      {
        role: 'user',
        content: 'Write all three scripts based on the research findings.',
      },
    ],
  })

  const textBlock = response.content.find(b => b.type === 'text')
  if (!textBlock) throw new Error('No text in script generation response')

  const title = extractTitle(textBlock.text)
  if (!title) throw new Error('No title block found in script response')

  const scripts = {}
  const productionNotes = {}
  for (const typeId of Object.keys(videoTypes)) {
    const script = extractScript(textBlock.text, typeId)
    if (!script) throw new Error(`No script block found for type: ${typeId}`)
    scripts[typeId] = script
    const notes = extractNotes(textBlock.text, typeId)
    if (notes) productionNotes[typeId] = notes
  }

  return { title, scripts, productionNotes }
}
