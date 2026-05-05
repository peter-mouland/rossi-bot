import { loadAvatars, loadAvatar } from '@rossi-bot/avatars'
import { runResearch, selectAngle, generateScripts } from '@rossi-bot/llm'
import * as heygen from '@rossi-bot/heygen'
import { saveTranscripts, saveResearch, saveDigest, renderFindingsMarkdown, loadVideoTypes, sendEmail, logger } from '@rossi-bot/core-platform'

// Register generators here as new packages are added.
// Each value must implement: submit(transcript, avatar), getStatus(videoId)
const generators = { heygen }

export async function run({ avatarId, researchMode = 'summary' } = {}) {
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

    // Research once per avatar — findings are shared across all video types
    let research
    try {
      research = await runResearch(avatar, { researchMode })
    } catch (err) {
      throw new Error(`[${avatar.name}] research failed: ${err.message}`)
    }

    // Select the best angle from candidate angles using avatar's editorial preference
    let chosenAngle
    try {
      chosenAngle = await selectAngle(avatar, research.findings)
    } catch (err) {
      throw new Error(`[${avatar.name}] angle selection failed: ${err.message}`)
    }

    // Generate all scripts in one call, sharing the same topic and title
    let title, scripts
    try {
      ;({ title, scripts } = await generateScripts(avatar, videoTypes, { chosenAngle, findings: research.findings }))
      logger.info(`  Title: ${title}`)
    } catch (err) {
      throw new Error(`[${avatar.name}] script generation failed: ${err.message}`)
    }

    // Save research report and single transcript file
    let transcriptPath
    try {
      const researchPath = await saveResearch(avatar, research)
      logger.info(`Research saved: ${researchPath}`)

      transcriptPath = await saveTranscripts(avatar, title, scripts, videoTypes)
      logger.info(`Transcript saved: ${transcriptPath}`)
    } catch (err) {
      throw new Error(`[${avatar.name}] saving output failed: ${err.message}`)
    }

    // Email transcript to output validators
    if (avatar.outputValidators?.length) {
      const transcriptContent = await import('fs/promises').then(fs => fs.readFile(transcriptPath, 'utf-8'))
      const emailBody = `${transcriptContent}\n\n---\n\n## Chosen Angle\n\n**${chosenAngle.angle}**\n\n${chosenAngle.rationale}\n\n*${chosenAngle.selectionRationale}*\n\n---\n\n## Research\n\n${renderFindingsMarkdown(research.findings)}`
      for (const email of avatar.outputValidators) {
        try {
          await sendEmail(avatar.fromEmail, email, `[${avatar.name}] ${title}`, emailBody)
        } catch (err) {
          logger.warn(`Failed to email ${email}: ${err.message}`)
        }
      }
    }

    // Always submit the teaser to HeyGen
    let submission
    try {
      submission = await generator.submit(scripts['teaser'], avatar, { title, dryRun })
      logger.info(`Video submitted: ${submission.videoId}`)
    } catch (err) {
      throw new Error(`[${avatar.name}] video submission failed (${avatar.generator}): ${err.message}`)
    }

    results.push({
      avatar: avatar.name,
      avatarId: avatar.id,
      title,
      transcriptPath,
      videoId: submission.videoId,
      status: submission.status,
    })
  }

  const digestPath = await saveDigest(results)
  logger.info(`Digest saved: ${digestPath}`)

  return { results, digestPath }
}
