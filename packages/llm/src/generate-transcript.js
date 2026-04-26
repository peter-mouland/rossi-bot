import { getClient } from './client.js'
import { toolDefinitions, executeTool } from './tools.js'
import { buildSystemPrompt, extractScript } from './prompts.js'
import { logger } from '@rossi-bot/core-platform'

export async function generateTranscript(avatar) {
  const client = getClient()

  const messages = [
    {
      role: 'user',
      content: `Research what's trending in "${avatar.topicOfExpertise}" right now and write a video script for ${avatar.name}.`,
    },
  ]

  logger.info(`Generating transcript for: ${avatar.name}`)

  while (true) {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 8096,
      system: buildSystemPrompt(avatar),
      tools: toolDefinitions,
      messages,
    })

    logger.debug(`Claude stop_reason: ${response.stop_reason}`)
    messages.push({ role: 'assistant', content: response.content })

    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find(b => b.type === 'text')
      if (!textBlock) throw new Error('Claude returned no text in final response')
      return extractScript(textBlock.text)
    }

    if (response.stop_reason === 'tool_use') {
      const toolResults = []

      for (const block of response.content) {
        if (block.type !== 'tool_use') continue

        logger.info(`Tool call: ${block.name}`, JSON.stringify(block.input))

        try {
          const result = await executeTool(block.name, block.input, { region: avatar.region })
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(result),
          })
        } catch (err) {
          logger.error(`Tool error (${block.name}): ${err.message}`)
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: `Error: ${err.message}`,
            is_error: true,
          })
        }
      }

      messages.push({ role: 'user', content: toolResults })
    }
  }
}
