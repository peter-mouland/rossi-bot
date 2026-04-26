import { loadAvatars, loadAvatar } from '@rossi-bot/avatars'
import { generateTranscript } from '@rossi-bot/llm'
import * as heygen from '@rossi-bot/heygen'
import { saveTranscript, saveDigest, logger } from '@rossi-bot/core-platform'

// Register generators here as new packages are added.
// Each value must implement: submit(transcript, avatar), getStatus(videoId)
const generators = {
  heygen,
}

export async function run({ avatarId } = {}) {
  const avatars = avatarId
    ? [await loadAvatar(avatarId)].filter(Boolean)
    : await loadAvatars()

  if (!avatars.length) {
    throw new Error(avatarId ? `Avatar not found: ${avatarId}` : 'No avatars configured')
  }

  const results = []

  for (const avatar of avatars) {
    const generator = generators[avatar.generator]
    if (!generator) {
      throw new Error(`Unknown generator "${avatar.generator}" on avatar: ${avatar.id}`)
    }

    logger.info(`--- Processing: ${avatar.name} ---`)

    let transcript
    try {
      transcript = await generateTranscript(avatar)
    } catch (err) {
      throw new Error(`[${avatar.name}] transcript generation failed: ${err.message}`)
    }

    let transcriptPath
    try {
      transcriptPath = await saveTranscript(avatar, transcript)
      logger.info(`Transcript saved: ${transcriptPath}`)
    } catch (err) {
      throw new Error(`[${avatar.name}] saving transcript failed: ${err.message}`)
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
      videoId: submission.videoId,
      status: submission.status,
    })
  }

  const digestPath = await saveDigest(results)
  logger.info(`Digest saved: ${digestPath}`)

  return { results, digestPath }
}
