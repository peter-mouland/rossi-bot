import { getClient } from './client.js'
import { toolDefinitions, executeTool } from './tools.js'
import { buildSystemPrompt, extractScript, extractTitle } from './prompts.js'
import { logger } from '@rossi-bot/core-platform'

export async function generateTranscript(avatar, videoType) {
  const client = getClient()

  const messages = [
    {
      role: 'user',
      content: `Research what's trending in "${avatar.topicOfExpertise}" right now and write a ${videoType.label} video script for ${avatar.name}.`,
    },
  ]

  logger.info(`Generating ${videoType.label} transcript for: ${avatar.name}`)

  // Research trail — captured for the report
  const toolCalls = []
  const reasoning = []

  while (true) {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 8096,
      system: buildSystemPrompt(avatar, videoType),
      tools: toolDefinitions,
      messages,
    })

    logger.debug(`Claude stop_reason: ${response.stop_reason}`)
    messages.push({ role: 'assistant', content: response.content })

    // Capture any reasoning text before the final response
    for (const block of response.content) {
      if (block.type === 'text' && response.stop_reason !== 'end_turn') {
        reasoning.push(block.text)
      }
    }

    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find(b => b.type === 'text')
      if (!textBlock) throw new Error('Claude returned no text in final response')
      return {
        transcript: extractScript(textBlock.text),
        title: extractTitle(textBlock.text),
        research: { toolCalls, reasoning },
      }
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
          toolCalls.push({ tool: block.name, input: block.input, result, error: null })
        } catch (err) {
          logger.error(`Tool error (${block.name}): ${err.message}`)
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: `Error: ${err.message}`,
            is_error: true,
          })
          toolCalls.push({ tool: block.name, input: block.input, result: null, error: err.message })
        }
      }

      messages.push({ role: 'user', content: toolResults })
    }
  }
}
