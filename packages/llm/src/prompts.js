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

  const researchGuidance = avatar.prompts?.research ? `\n${avatar.prompts.research}\n` : ''

  return `You are a content researcher for ${avatar.name}.
Today's date is ${currentDate()}. All search tools are pre-filtered to the last 7 days — only surface content published in that window. Use this when constructing search queries — never append a year other than ${currentYear()}.

## Avatar Profile
- **Name:** ${avatar.name}
- **Region:** ${avatar.region} (all searches and content should be relevant to this region)
${researchGuidance}
## Your Task
${sourceList}
${sources.length + 1}. Call \`report_findings\` with your structured research output

Only include sources published in the last 7 days. Provide 2–4 candidate angles. Each must be meaningfully distinct.`
}

export function buildAngleSelectionPrompt(avatar) {
  const angleGuidance = avatar.prompts?.angle ?? ''

  return `You are an editorial assistant for ${avatar.name}.

## Avatar Profile
- **Name:** ${avatar.name}

## Angle Preference
${angleGuidance}

## Your Task
Call \`select_angle\` with the index of the best candidate angle from the list provided.
Apply the angle preference above strictly — it is the editorial rule that overrides all other considerations.`
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
    teaser: 'Creates a specific curiosity gap — one surprising fact or statement that makes the viewer need to know more. Does NOT resolve the question. No action, no answer, just the hook. End by directing viewers to the deep dive for the full picture.',
    summary: 'Directly answers the surface question and gives one clear action. Assumes the viewer saw the teaser and wants the short version. End by telling viewers the deep dive goes much further — give them a reason to watch it.',
    'deep-dive': 'Earns the full picture — backstory, mechanism, edge cases, lasting insight. Assumes the viewer wants to properly understand, not just the answer. Change angle, tone, or story roughly every 90 seconds to maintain attention. Close with a single reframe sentence — not a list, not a summary.',
  }

  const typeBlocks = Object.entries(videoTypes)
    .map(([id, vt]) => {
      const seriesRole = typeDescriptions[id] ?? vt.description
      const charLimit = vt.maxChars ? ` — HARD LIMIT: ${vt.maxChars} characters maximum, do not exceed` : ''
      return `### ${vt.label} (\`${id}\`)
Series role: ${seriesRole}
Target: ${vt.durationSeconds}s (~${vt.approxWords} words — count carefully${charLimit})`
    })
    .join('\n\n')

  const isDeepDive = (id) => id === 'deep-dive'

  const outputBlocks = Object.keys(videoTypes)
    .map(id => {
      const notesFields = isDeepDive(id)
        ? 'emotion: [intended tone]\nkeyQuote: [most quotable line from this script]\nchapterMarkers: [0:00 — section | 1:30 — section | ...]'
        : 'emotion: [intended tone]\nkeyQuote: [most quotable line from this script]'
      return `\`\`\`${id}\nYour ${id} script here...\n\`\`\`\n\n\`\`\`notes-${id}\n${notesFields}\n\`\`\``
    })
    .join('\n\n')

  const scriptGuidance = avatar.prompts?.script ? `${avatar.prompts.script}\n\n` : ''

  const exampleBlock = exampleScript
    ? `## Example Script — Match This Voice\n${exampleScript}\n\n`
    : ''

  return `You are a scriptwriter for ${avatar.name}.
Today's date is ${currentDate()}.
These scripts will be spoken aloud by an AI video avatar — write for the ear, not the eye. Pacing is controlled with SSML break tags.

## Avatar Profile
- **Name:** ${avatar.name}
- **Region:** ${avatar.region}

## Content Series
These three formats are a funnel — not three versions of the same script. The teaser creates a curiosity gap. The summary resolves it. The deep-dive earns the full understanding. Write them so a viewer who watches all three gets a progressively richer experience, not the same points repeated at different lengths. The teaser and summary must end with a natural prompt to watch the deep dive — not a forced call-to-action, but a genuine reason ("there's a lot more to this", "the full picture is more interesting", "I go into the mechanics in the deep dive").

Find the time-sensitive element in the research — a rate that could change, a deadline, a trend that's moving now — and name it. Give the viewer a reason this week matters, not next month.

${scriptGuidance}${exampleBlock}## Angle to Cover
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
- Use \`<break time="0.5s"/>\` between punchy sentences where a natural pause would land. Use \`<break time="1s"/>\` at major section transitions in the deep-dive. Do not overuse — one every few sentences maximum.

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

// Parses a ```notes-<typeId>``` block into a plain object.
// Each line is "key: value". Returns null if block not found.
export function extractNotes(text, typeId) {
  const match = text.match(new RegExp('```notes-' + typeId + '\\n([\\s\\S]*?)\\n```'))
  if (!match) return null
  const notes = {}
  for (const line of match[1].split('\n')) {
    const colon = line.indexOf(':')
    if (colon === -1) continue
    const key = line.slice(0, colon).trim()
    const value = line.slice(colon + 1).trim()
    if (key && value) notes[key] = value
  }
  return Object.keys(notes).length ? notes : null
}
