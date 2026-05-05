import { getClient } from '../client.js'
import { buildAllScriptsPrompt, extractTitle, extractScript } from '../prompts.js'
import { logger } from '@rossi-bot/core-platform'

// Returns { title, scripts: { teaser, summary, 'deep-dive' } }
// context = { chosenAngle, findings }
export async function generateScripts(avatar, videoTypes, context) {
  const client = getClient()

  logger.info(`Generating scripts for: ${avatar.name}`)

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 8096,
    system: buildAllScriptsPrompt(avatar, videoTypes, context),
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
  for (const typeId of Object.keys(videoTypes)) {
    const script = extractScript(textBlock.text, typeId)
    if (!script) throw new Error(`No script block found for type: ${typeId}`)
    scripts[typeId] = script
  }

  return { title, scripts }
}
