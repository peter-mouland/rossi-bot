import { loadAvatars, loadAvatar } from '@rossi-bot/avatars'
import { generateTranscript } from '@rossi-bot/llm'
import * as heygen from '@rossi-bot/heygen'
import { saveTranscript, saveResearch, saveDigest, loadVideoType, logger } from '@rossi-bot/core-platform'

// Register generators here as new packages are added.
// Each value must implement: submit(transcript, avatar), getStatus(videoId)
const generators = {
  heygen,
}

export async function run({ avatarId, type = 'teaser' } = {}) {
  const [avatars, videoType] = await Promise.all([
    avatarId ? loadAvatar(avatarId).then(a => [a].filter(Boolean)) : loadAvatars(),
    loadVideoType(type),
  ])

  if (!avatars.length) {
    throw new Error(avatarId ? `Avatar not found: ${avatarId}` : 'No avatars configured')
  }

  logger.info(`Video type: ${videoType.label} (${videoType.durationSeconds}s / ~${videoType.approxWords} words)`)

  const results = []

  for (const avatar of avatars) {
    const generator = generators[avatar.generator]
    if (!generator) {
      throw new Error(`Unknown generator "${avatar.generator}" on avatar: ${avatar.id}`)
    }

    logger.info(`--- Processing: ${avatar.name} ---`)

    let transcript, research
    try {
      ({ transcript, research } = await generateTranscript(avatar, videoType))
    } catch (err) {
      throw new Error(`[${avatar.name}] transcript generation failed: ${err.message}`)
    }

    let transcriptPath, researchPath
    try {
      transcriptPath = await saveTranscript(avatar, transcript)
      logger.info(`Transcript saved: ${transcriptPath}`)
      researchPath = await saveResearch(avatar, videoType, research)
      logger.info(`Research report saved: ${researchPath}`)
    } catch (err) {
      throw new Error(`[${avatar.name}] saving output failed: ${err.message}`)
    }

    let submission
    try {
      submission = await generator.submit(transcript, avatar)
      logger.info(`Video submitted: ${submission.videoId}`)
    } catch (err) {
      throw new Error(`[${avatar.name}] video submission failed (${avatar.generator}): ${err.message}`)
    }

    results.push({
      avatar: avatar.name,
      avatarId: avatar.id,
      transcriptPath,
      researchPath,
      videoId: submission.videoId,
      status: submission.status,
    })
  }

  const digestPath = await saveDigest(results)
  logger.info(`Digest saved: ${digestPath}`)

  return { results, digestPath }
}
