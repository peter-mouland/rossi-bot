import { getSourceGuidance } from './sources/index.js'

function currentDate() {
  return new Date().toISOString().split('T')[0]
}

function currentYear() {
  return new Date().getFullYear()
}

export function buildResearchPrompt(avatar, sources = ['web', 'youtube']) {
  const sourceList = sources
    .map((id, i) => `${i + 1}. Use \`${getSourceGuidance(id)}\``)
    .join('\n')

  const focusBlock = avatar.researchFocus
    ? `\n## Research Focus\n${avatar.researchFocus}\nPrioritise sources that match this. Discard results that clearly don't.\n`
    : ''

  const forbiddenBlock = avatar.forbiddenTopics?.length
    ? `\n## Off-Limits Topics\nDo not surface, select, or include sources related to:\n${avatar.forbiddenTopics.map(t => `- ${t}`).join('\n')}\n`
    : ''

  return `You are a content researcher for ${avatar.name}.
Today's date is ${currentDate()}. All search tools are pre-filtered to the last 7 days — only surface content published in that window. Use this when constructing search queries — never append a year other than ${currentYear()}.

## Avatar Profile
- **Name:** ${avatar.name}
- **Topic of Expertise:** ${avatar.topicOfExpertise}
- **Sub-topics:** ${avatar.subTopics.join(', ')}
- **Region:** ${avatar.region} (all searches and content should be relevant to this region)
${focusBlock}${forbiddenBlock}
## Your Task
${sourceList}
${sources.length + 1}. Call \`report_findings\` with your structured research output

Only include sources published in the last 7 days. Provide 2–4 candidate angles. Each must be meaningfully distinct.`
}

export function buildAngleSelectionPrompt(avatar) {
  return `You are an editorial assistant for ${avatar.name}.

## Avatar Profile
- **Name:** ${avatar.name}
- **Topic of Expertise:** ${avatar.topicOfExpertise}
- **Angle Preference:** ${avatar.anglePreference}

## Your Task
Call \`select_angle\` with the index of the best candidate angle from the list provided.
Apply the avatar's angle preference strictly — it is the editorial rule that overrides all other considerations.`
}

export function buildAllScriptsPrompt(avatar, videoTypes, { chosenAngle, findings, rawSources, exampleScript }) {
  const supportingSources = (chosenAngle.supportingSourceIndices ?? [])
    .map(i => findings.sources[i])
    .filter(Boolean)
    .map(s => `- **${s.title}** (${s.source}${s.publishedAt ? `, ${s.publishedAt}` : ''}): ${s.summary}`)
    .join('\n')

  const rawSourcesBlock = rawSources?.length
    ? '\n### Raw Source Data\nFull results from each search tool — use this detail to add precision and texture to your scripts:\n\n' +
      rawSources
        .filter(c => !c.error && c.result)
        .map(c => `#### ${c.tool} — \`${JSON.stringify(c.input)}\`\n\`\`\`json\n${JSON.stringify(c.result, null, 2)}\n\`\`\``)
        .join('\n\n')
    : ''

  const typeDescriptions = {
    teaser: 'Creates a specific curiosity gap — one surprising fact or statement that makes the viewer need to know more. Does NOT resolve the question. No action, no answer, just the hook.',
    summary: 'Directly answers the surface question and gives one clear action. Assumes the viewer saw the teaser and wants the short version.',
    'deep-dive': 'Earns the full picture — backstory, mechanism, edge cases, lasting insight. Assumes the viewer wants to properly understand, not just the answer.',
  }

  const typeBlocks = Object.entries(videoTypes)
    .map(([id, vt]) => {
      const seriesRole = typeDescriptions[id] ?? vt.description
      return `### ${vt.label} (\`${id}\`)
Series role: ${seriesRole}
Target: ${vt.durationSeconds}s (~${vt.approxWords} words — count carefully)`
    })
    .join('\n\n')

  const outputBlocks = Object.keys(videoTypes)
    .map(id => `\`\`\`${id}\nYour ${id} script here...\n\`\`\``)
    .join('\n\n')

  const voiceRulesBlock = avatar.voiceRules?.length
    ? '## Voice Rules — Non-Negotiable\n' +
      avatar.voiceRules.map((r, i) => `${i + 1}. ${r}`).join('\n') +
      '\n\nThese override all other instructions. If in doubt, shorter and more specific wins.\n\n'
    : ''

  const exampleBlock = exampleScript
    ? `## Example Script — Match This Voice\n${exampleScript}\n\n`
    : ''

  const audienceBlock = avatar.audience
    ? `- **Audience:** ${avatar.audience}\n`
    : ''

  const forbiddenBlock = avatar.forbiddenTopics?.length
    ? `\n## Off-Limits\nNever cover these topics, even if the angle touches them:\n${avatar.forbiddenTopics.map(t => `- ${t}`).join('\n')}\n`
    : ''

  return `You are a scriptwriter for ${avatar.name}.
Today's date is ${currentDate()}.

## Avatar Profile
- **Name:** ${avatar.name}
- **Voice:** ${avatar.toneOfVoice}
- **Region:** ${avatar.region}
${audienceBlock}${forbiddenBlock}
## Content Series
These three formats are a funnel — not three versions of the same script. The teaser creates a curiosity gap. The summary resolves it. The deep-dive earns the full understanding. Write them so a viewer who watches all three gets a progressively richer experience, not the same points repeated at different lengths.

${voiceRulesBlock}${exampleBlock}## Angle to Cover
${chosenAngle.angle}

**Why this angle:** ${chosenAngle.rationale}
**Editorial note:** ${chosenAngle.selectionRationale}

## Sources
${supportingSources || 'No specific sources flagged — use your judgement from the research.'}
${rawSourcesBlock}
## Video Formats
${typeBlocks}

## Requirements
- Written in ${avatar.name}'s voice — see Voice Rules above
- Pure spoken words only — no stage directions, no scene headings
- Hit the word counts precisely

## Output Format
\`\`\`title
A short, specific, attention-grabbing title (max 60 chars) — shared across all formats
\`\`\`

${outputBlocks}`
}

export function extractTitle(text) {
  const match = text.match(/```title\n([\s\S]*?)\n```/)
  return match ? match[1].trim() : null
}

export function extractScript(text, typeId) {
  const match = text.match(new RegExp('```' + typeId + '\\n([\\s\\S]*?)\\n```'))
  return match ? match[1].trim() : null
}
