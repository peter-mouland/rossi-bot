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

// generated = { teaser: { transcript, title, videoType }, summary: { ... }, ... }
export async function saveTranscripts(avatar, generated) {
  const date = today()
  const dir = join(avatar.dir, 'transcripts')
  await mkdir(dir, { recursive: true })

  const lines = [`# ${avatar.name} — ${date}\n`]

  for (const [, { transcript, title, videoType }] of Object.entries(generated)) {
    lines.push(`## ${videoType.label}`)
    if (title) lines.push(`**${title}**\n`)
    lines.push(transcript)
    lines.push('')
  }

  const path = join(dir, `${date}.md`)
  await writeFile(path, lines.join('\n'), 'utf-8')
  return path
}

export async function saveResearch(avatar, videoType, research) {
  const date = today()
  const dir = join(avatar.dir, 'research')
  await mkdir(dir, { recursive: true })

  const lines = [
    `# ${avatar.name} — Research Report — ${date}`,
    `**Video Type:** ${videoType.label} (${videoType.durationSeconds}s)\n`,
  ]

  lines.push(`## Tool Calls (${research.toolCalls.length})\n`)
  for (const call of research.toolCalls) {
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
    lines.push(`- **Video ID:** \`${result.videoId}\``)
    lines.push(`- **Status:** ${result.status}`)
    lines.push(`- **Transcript:** ${result.transcriptPath}`)
    lines.push(`- **Research:** ${result.researchPath}`)
    lines.push('')
  }

  const path = join(dir, `${date}.md`)
  await writeFile(path, lines.join('\n'), 'utf-8')
  return path
}
