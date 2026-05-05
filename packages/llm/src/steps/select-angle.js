import { getClient } from '../client.js'
import { buildAngleSelectionPrompt } from '../prompts.js'
import { logger } from '@rossi-bot/core-platform'

const SELECT_ANGLE_TOOL = {
  name: 'select_angle',
  description: 'Select the best candidate angle from the research findings.',
  input_schema: {
    type: 'object',
    required: ['chosenAngleIndex', 'rationale'],
    properties: {
      chosenAngleIndex: { type: 'integer', description: 'Index into the candidateAngles array' },
      rationale: { type: 'string', description: 'One sentence explaining why this angle was chosen given the preference' },
    },
  },
}

export async function selectAngle(avatar, findings) {
  const client = getClient()
  logger.info(`Selecting angle for: ${avatar.name}`)

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system: buildAngleSelectionPrompt(avatar),
    tools: [SELECT_ANGLE_TOOL],
    tool_choice: { type: 'tool', name: 'select_angle' },
    messages: [
      {
        role: 'user',
        content: `Here are the candidate angles:\n\n${JSON.stringify(findings.candidateAngles, null, 2)}\n\nSelect the best one based on the angle preference.`,
      },
    ],
  })

  const block = response.content.find(b => b.type === 'tool_use' && b.name === 'select_angle')
  if (!block) throw new Error('Angle selection did not call select_angle tool')

  const { chosenAngleIndex, rationale } = block.input
  const chosenAngle = findings.candidateAngles[chosenAngleIndex]
  if (!chosenAngle) throw new Error(`Angle selection returned invalid index: ${chosenAngleIndex}`)

  logger.info(`  Angle: ${chosenAngle.angle}`)
  return { ...chosenAngle, selectionRationale: rationale }
}
