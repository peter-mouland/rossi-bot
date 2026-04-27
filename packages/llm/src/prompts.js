function currentDate() {
  return new Date().toISOString().split('T')[0]
}

function currentYear() {
  return new Date().getFullYear()
}

export function buildResearchPrompt(avatar) {
  return `You are a content researcher for ${avatar.name}.
Today's date is ${currentDate()}. Use this when constructing search queries — never append a year other than ${currentYear()}.

## Avatar Profile
- **Name:** ${avatar.name}
- **Topic of Expertise:** ${avatar.topicOfExpertise}
- **Sub-topics:** ${avatar.subTopics.join(', ')}
- **Region:** ${avatar.region} (all searches and content should be relevant to this region)

## Your Task
1. Use \`search_web\` to discover what is trending right now in ${avatar.topicOfExpertise} for a ${avatar.region} audience — news, Reddit discussions, expert commentary
2. Use \`search_youtube\` to find the top videos on the most relevant trending angle
3. Use \`search_web\` again for deeper context on the angle you've chosen — analysis, data, real examples
4. Synthesise your findings into a structured research summary

## Output Format
Return only the research findings — no script. Use exactly this structure:

\`\`\`findings
## What's Trending
[bullet points of trending topics/queries and their momentum]

## Top Content Found
[list of most relevant videos and articles with key takeaways]

## Chosen Angle
[the single most timely and relevant angle for ${avatar.name} to cover, and why]
\`\`\``
}

// videoTypes = { teaser: { label, durationSeconds, approxWords, description }, ... }
export function buildAllScriptsPrompt(avatar, videoTypes, findings) {
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

## Research Findings
${findings}

## Your Task
Write all three video formats on the SAME topic and angle from the research above.
One title covers all three formats — they are the teaser, summary, and deep-dive of the same video series.

## Video Formats
${typeBlocks}

## Requirements for all scripts
- Written in ${avatar.name}'s voice: ${avatar.toneOfVoice}
- Pure spoken words only — no stage directions, no scene headings
- Hit the word counts precisely

## Output Format
\`\`\`title
A short, specific, attention-grabbing title (max 60 chars) — shared across all formats
\`\`\`

${outputBlocks}`
}

export function extractFindings(text) {
  const match = text.match(/```findings\n([\s\S]*?)\n```/)
  return match ? match[1].trim() : text.trim()
}

export function extractTitle(text) {
  const match = text.match(/```title\n([\s\S]*?)\n```/)
  return match ? match[1].trim() : null
}

export function extractScript(text, typeId) {
  const match = text.match(new RegExp('```' + typeId + '\\n([\\s\\S]*?)\\n```'))
  return match ? match[1].trim() : null
}
