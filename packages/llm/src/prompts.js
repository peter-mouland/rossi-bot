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

  return `You are a content researcher for ${avatar.name}.
Today's date is ${currentDate()}. Use this when constructing search queries — never append a year other than ${currentYear()}.

## Avatar Profile
- **Name:** ${avatar.name}
- **Topic of Expertise:** ${avatar.topicOfExpertise}
- **Sub-topics:** ${avatar.subTopics.join(', ')}
- **Region:** ${avatar.region} (all searches and content should be relevant to this region)

## Your Task
${sourceList}
${sources.length + 1}. Call \`report_findings\` with your structured research output

Provide 2–4 candidate angles. Each must be meaningfully distinct.`
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

export function buildAllScriptsPrompt(avatar, videoTypes, { chosenAngle, findings, rawSources }) {
  const supportingSources = (chosenAngle.supportingSourceIndices ?? [])
    .map(i => findings.sources[i])
    .filter(Boolean)
    .map(s => `- **${s.title}** (${s.source}${s.publishedAt ? `, ${s.publishedAt}` : ''}): ${s.summary}`)
    .join('\n')

  const rawSourcesBlock = rawSources?.length
    ? '\n\n## Raw Source Data\nFull results from each search tool — use this detail to enrich your scripts:\n\n' +
      rawSources
        .filter(c => !c.error && c.result)
        .map(c => `### ${c.tool} — \`${JSON.stringify(c.input)}\`\n\`\`\`json\n${JSON.stringify(c.result, null, 2)}\n\`\`\``)
        .join('\n\n')
    : ''

  const typeBlocks = Object.entries(videoTypes)
    .map(([id, vt]) => `### ${vt.label} (\`${id}\`)
${vt.description}
- Target: ${vt.durationSeconds}s (~${vt.approxWords} words — count carefully)`)
    .join('\n\n')

  const outputBlocks = Object.keys(videoTypes)
    .map(id => `\`\`\`${id}\nYour ${id} script here...\n\`\`\``)
    .join('\n\n')

  return `You are a scriptwriter for ${avatar.name}.
Today's date is ${currentDate()}.

## Avatar Profile
- **Name:** ${avatar.name}
- **Tone of Voice:** ${avatar.toneOfVoice}
- **Region:** ${avatar.region}

## Angle to Cover
${chosenAngle.angle}

**Why this angle:** ${chosenAngle.rationale}
**Editorial note:** ${chosenAngle.selectionRationale}

## Primary Sources
${supportingSources || 'No specific sources flagged — use your judgement from the research.'}

## Your Task
Write all three video formats on the SAME topic and angle above.
One title covers all three formats — they are the teaser, summary, and deep-dive of the same video series.

## Video Formats
${typeBlocks}

## Requirements for all scripts
- Written in ${avatar.name}'s voice: ${avatar.toneOfVoice}
- Pure spoken words only — no stage directions, no scene headings
- Hit the word counts
${rawSourcesBlock}
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
