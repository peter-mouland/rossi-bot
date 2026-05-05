import { getClient } from '../client.js'
import { getToolDefinitions, DEFAULT_SOURCES, executeTool } from '../sources/index.js'
import { buildResearchPrompt } from '../prompts.js'
import { logger } from '@rossi-bot/core-platform'

const REPORT_FINDINGS_TOOL = {
  name: 'report_findings',
  description: 'Submit your structured research findings once you have finished searching all sources.',
  input_schema: {
    type: 'object',
    required: ['sources', 'trendingTopics', 'candidateAngles'],
    properties: {
      sources: {
        type: 'array',
        items: {
          type: 'object',
          required: ['title', 'url', 'source', 'summary', 'relevanceSignal'],
          properties: {
            title: { type: 'string' },
            url: { type: 'string' },
            source: { type: 'string', description: 'Source id, e.g. bbc-business' },
            publishedAt: { type: 'string', description: 'YYYY-MM-DD, or omit if unknown' },
            summary: { type: 'string', description: 'One or two sentence summary' },
            relevanceSignal: { type: 'string', enum: ['high', 'medium', 'low'] },
          },
        },
      },
      trendingTopics: {
        type: 'array',
        items: {
          type: 'object',
          required: ['topic', 'momentum', 'evidenceIndices'],
          properties: {
            topic: { type: 'string' },
            momentum: { type: 'string', description: 'Why this is trending right now' },
            evidenceIndices: { type: 'array', items: { type: 'integer' }, description: 'Indices into sources[]' },
          },
        },
      },
      candidateAngles: {
        type: 'array',
        minItems: 2,
        maxItems: 4,
        description: 'Meaningfully distinct angles the avatar could cover',
        items: {
          type: 'object',
          required: ['angle', 'rationale', 'supportingSourceIndices'],
          properties: {
            angle: { type: 'string', description: 'Specific angle for the avatar to cover — one sentence' },
            rationale: { type: 'string', description: 'Why this angle is timely and suits the avatar' },
            supportingSourceIndices: { type: 'array', items: { type: 'integer' }, description: 'Indices into sources[]' },
          },
        },
      },
    },
  },
}

function summariseToolResult(toolName, result) {
  const items = Array.isArray(result) ? result : (result.results ?? [])
  if (!items.length) return 'No results found.'

  const lines = [`Found ${items.length} result${items.length !== 1 ? 's' : ''}:`]
  for (const item of items.slice(0, 3)) {
    const title = item.title ?? '(untitled)'
    const source = item.source ?? item.channel ?? item.author ?? toolName
    const date = item.publishedAt ?? item.date ?? null
    const datePart = date ? ` (${date.slice(0, 10)})` : ''
    lines.push(`• "${title}" — ${source}${datePart} ${item.url ?? ''}`.trimEnd())
  }
  if (items.length > 3) lines.push(`  … ${items.length - 3} more`)
  return lines.join('\n')
}

export async function runResearch(avatar, { researchMode = 'summary' } = {}) {
  const client = getClient()

  const messages = [
    {
      role: 'user',
      content: `Research what's trending in "${avatar.topicOfExpertise}" right now for a ${avatar.region} audience.`,
    },
  ]

  const sources = avatar.newsSources ?? DEFAULT_SOURCES
  const tools = [...getToolDefinitions(sources), REPORT_FINDINGS_TOOL]
  logger.info(`Researching trends for: ${avatar.name} (sources: ${sources.join(', ')}, mode: ${researchMode})`)

  const toolCalls = []
  const reasoning = []

  while (true) {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 8096,
      system: buildResearchPrompt(avatar, sources),
      tools,
      messages,
    })

    logger.debug(`Research stop_reason: ${response.stop_reason}`)
    messages.push({ role: 'assistant', content: response.content })

    for (const block of response.content) {
      if (block.type === 'text' && response.stop_reason !== 'end_turn') {
        reasoning.push(block.text)
      }
    }

    if (!['tool_use', 'end_turn'].includes(response.stop_reason)) {
      throw new Error(`Research stopped unexpectedly (stop_reason: ${response.stop_reason}) — context may be too large`)
    }

    if (response.stop_reason === 'tool_use') {
      const toolResults = []
      let findings = null

      for (const block of response.content) {
        if (block.type !== 'tool_use') continue

        if (block.name === 'report_findings') {
          findings = block.input
          // Must ack every tool_use — even the final one — before returning
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: 'Findings received.' })
          continue
        }

        logger.info(`Tool: ${block.name} ${JSON.stringify(block.input)}`)

        try {
          const result = await executeTool(block.name, block.input, { region: avatar.region })
          const content = researchMode === 'full'
            ? JSON.stringify(result)
            : summariseToolResult(block.name, result)
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content })
          toolCalls.push({ tool: block.name, input: block.input, result, error: null })
        } catch (err) {
          logger.error(`Tool error (${block.name}): ${err.message}`)
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: `Error: ${err.message}`, is_error: true })
          toolCalls.push({ tool: block.name, input: block.input, result: null, error: err.message })
        }
      }

      messages.push({ role: 'user', content: toolResults })

      if (findings) {
        logger.info(`  Research complete: ${findings.sources.length} sources, ${findings.candidateAngles.length} angles`)
        return { findings, toolCalls, reasoning }
      }
    }

    if (response.stop_reason === 'end_turn') {
      throw new Error('Research ended without calling report_findings')
    }
  }
}
