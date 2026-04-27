import { loadAvatars, loadAvatar } from '@rossi-bot/avatars'
import { generateTranscript } from '@rossi-bot/llm'
import * as heygen from '@rossi-bot/heygen'
import { saveTranscripts, saveResearch, saveDigest, loadVideoTypes, logger } from '@rossi-bot/core-platform'

// Register generators here as new packages are added.
// Each value must implement: submit(transcript, avatar), getStatus(videoId)
const generators = { heygen }

export async function run({ avatarId } = {}) {
  const [avatars, videoTypes] = await Promise.all([
    avatarId ? loadAvatar(avatarId).then(a => [a].filter(Boolean)) : loadAvatars(),
    loadVideoTypes(),
  ])

  if (!avatars.length) {
    throw new Error(avatarId ? `Avatar not found: ${avatarId}` : 'No avatars configured')
  }

  const dryRun = process.env.DRY_RUN === 'true'
  if (dryRun) logger.info('[DRY RUN] Video submission will be skipped')

  const results = []

  for (const avatar of avatars) {
    const generator = generators[avatar.generator]
    if (!generator) {
      throw new Error(`Unknown generator "${avatar.generator}" on avatar: ${avatar.id}`)
    }

    logger.info(`--- Processing: ${avatar.name} ---`)

    // Generate all video types and collect results
    const generated = {}
    for (const [typeId, typeConfig] of Object.entries(videoTypes)) {
      const videoType = { id: typeId, ...typeConfig }
      logger.info(`Generating ${videoType.label}...`)

      try {
        const { transcript, title, research } = await generateTranscript(avatar, videoType)
        logger.info(`  Title: ${title}`)
        generated[typeId] = { transcript, title, research, videoType }
      } catch (err) {
        throw new Error(`[${avatar.name}] ${typeId} generation failed: ${err.message}`)
      }
    }

    // Save all transcripts to one file, research reports per type
    let transcriptPath
    try {
      transcriptPath = await saveTranscripts(avatar, generated)
      logger.info(`Transcripts saved: ${transcriptPath}`)

      for (const [typeId, { research, videoType }] of Object.entries(generated)) {
        const researchPath = await saveResearch(avatar, videoType, research)
        logger.info(`Research saved (${typeId}): ${researchPath}`)
      }
    } catch (err) {
      throw new Error(`[${avatar.name}] saving output failed: ${err.message}`)
    }

    // Always submit the teaser to HeyGen
    const teaser = generated['teaser']
    let submission
    try {
      submission = await generator.submit(teaser.transcript, avatar, { title: teaser.title, dryRun })
      logger.info(`Video submitted: ${submission.videoId}`)
    } catch (err) {
      throw new Error(`[${avatar.name}] video submission failed (${avatar.generator}): ${err.message}`)
    }

    results.push({
      avatar: avatar.name,
      avatarId: avatar.id,
      title: teaser.title,
      transcriptPath,
      videoId: submission.videoId,
      status: submission.status,
    })
  }

  const digestPath = await saveDigest(results)
  logger.info(`Digest saved: ${digestPath}`)

  return { results, digestPath }
}
