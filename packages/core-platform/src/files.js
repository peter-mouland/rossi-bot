import { writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

function outputDir() {
  return join(ROOT, process.env.OUTPUT_DIR ?? 'output')
}

function today() {
  return new Date().toISOString().split('T')[0]
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
}

// Saves one file for all video formats: [date]-[slug].md
// scripts = { teaser: '...', summary: '...', 'deep-dive': '...' }
// productionNotes = { teaser: { emotion, keyQuote }, ... }
// videoTypes = { teaser: { label, ... }, ... }
export async function saveTranscripts(avatar, title, scripts, videoTypes, productionNotes = {}) {
  const date = today()
  const dir = join(avatar.dir, 'transcripts')
  await mkdir(dir, { recursive: true })

  const slug = slugify(title)
  const filename = `${date}-${slug}.md`

  const lines = [
    `# ${title}`,
    `**${avatar.name} — ${date}**\n`,
  ]

  for (const [typeId, script] of Object.entries(scripts)) {
    const label = videoTypes[typeId]?.label ?? typeId
    lines.push(`## ${label}`)
    lines.push(script)
    const notes = productionNotes[typeId]
    if (notes) {
      lines.push('')
      for (const [k, v] of Object.entries(notes)) {
        lines.push(`> **${k}:** ${v}`)
      }
    }
    lines.push('')
  }

  const path = join(dir, filename)
  await writeFile(path, lines.join('\n'), 'utf-8')
  return path
}

export function renderFindingsMarkdown(findings) {
  const lines = []
  const sources = findings.sources ?? []

  function renderSource(s) {
    const date = s.publishedAt ? ` — ${s.publishedAt}` : ''
    return `  - **[${s.title}](${s.url})** (${s.source}${date})`
  }

  if (Array.isArray(findings.trendingTopics) && findings.trendingTopics.length) {
    lines.push('## Trending Topics\n')
    for (const t of findings.trendingTopics) {
      lines.push(`### ${t.topic}`)
      lines.push(t.momentum)
      const evidence = (t.evidenceIndices ?? []).map(i => sources[i]).filter(Boolean)
      if (evidence.length) {
        for (const s of evidence) lines.push(renderSource(s))
      }
      lines.push('')
    }
  }

  if (Array.isArray(findings.candidateAngles) && findings.candidateAngles.length) {
    lines.push('## Candidate Angles\n')
    for (const [i, a] of findings.candidateAngles.entries()) {
      lines.push(`${i + 1}. **${a.angle}**`)
      lines.push(`   ${a.rationale}`)
      const supporting = (a.supportingSourceIndices ?? []).map(i => sources[i]).filter(Boolean)
      if (supporting.length) {
        for (const s of supporting) lines.push(renderSource(s))
      }
      lines.push('')
    }
  }

  return lines.join('\n')
}

export async function saveResearch(avatar, research) {
  const date = today()
  const dir = join(avatar.dir, 'research')
  await mkdir(dir, { recursive: true })

  const lines = [
    `# ${avatar.name} — Research Report — ${date}\n`,
  ]

  if (research.findings) {
    lines.push(renderFindingsMarkdown(research.findings))
  }

  lines.push(`## Tool Calls (${research.toolCalls.length})\n`)
  for (const call of (research.toolCalls ?? [])) {
    lines.push(`### ${call.tool}`)
    lines.push(`**Input:** \`${JSON.stringify(call.input)}\`\n`)
    if (call.error) {
      lines.push(`**Error:** ${call.error}\n`)
    } else {
      lines.push('**Results:**')
      lines.push('```json')
      lines.push(JSON.stringify(call.result, null, 2))
      lines.push('```\n')
    }
  }

  if (research.reasoning.length) {
    lines.push(`## Claude's Reasoning\n`)
    for (const text of research.reasoning) {
      lines.push(text)
      lines.push('')
    }
  }

  const path = join(dir, `${date}.md`)
  await writeFile(path, lines.join('\n'), 'utf-8')
  return path
}

export async function saveDigest(results) {
  const date = today()
  const dir = join(outputDir(), 'digests')
  await mkdir(dir, { recursive: true })

  const lines = [
    `# Daily Digest — ${date}\n`,
    `Generated ${results.length} video(s).\n`,
  ]

  for (const result of results) {
    lines.push(`## ${result.avatar}`)
    if (result.title) lines.push(`**"${result.title}"**\n`)
    for (const s of result.submissions ?? []) {
      lines.push(`- **${s.analysis}/${s.typeId}:** \`${s.videoId}\` — ${s.status}`)
    }
    lines.push(`- **Transcript:** ${result.transcriptPath}`)
    lines.push('')
  }

  const path = join(dir, `${date}.md`)
  await writeFile(path, lines.join('\n'), 'utf-8')
  return path
}
