import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

function outputDir() {
  return process.env.OUTPUT_DIR ?? 'output'
}

function today() {
  return new Date().toISOString().split('T')[0]
}

export async function saveTranscript(avatar, transcript) {
  const date = today()
  const dir = join(avatar.dir, 'transcripts')
  await mkdir(dir, { recursive: true })

  const content = `# ${avatar.name} — ${date}\n\n${transcript}\n`
  const path = join(dir, `${date}.md`)
  await writeFile(path, content, 'utf-8')
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
    lines.push(`- **Video ID:** \`${result.videoId}\``)
    lines.push(`- **Status:** ${result.status}`)
    lines.push(`- **Transcript:** ${result.transcriptPath}`)
    lines.push('')
  }

  const path = join(dir, `${date}.md`)
  await writeFile(path, lines.join('\n'), 'utf-8')
  return path
}
