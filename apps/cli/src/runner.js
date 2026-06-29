import { loadAvatars, loadAvatar } from '@rossi-bot/avatars'
import { runResearch, selectAngle, generateScripts, critiqueScripts } from '@rossi-bot/llm'
import * as heygen from '@rossi-bot/heygen'
import { saveTranscripts, saveResearch, saveDigest, renderFindingsMarkdown, loadVideoTypes, sendEmail, logger } from '@rossi-bot/core-platform'

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

    // Research runs once — both analyses are on the same topic
    let research
    try {
      research = await runResearch(avatar, { researchMode: 'summary' })
    } catch (err) {
      throw new Error(`[${avatar.name}] research failed: ${err.message}`)
    }

    // Single angle selection — both scripts cover the same angle
    let chosenAngle
    try {
      chosenAngle = await selectAngle(avatar, research.findings)
    } catch (err) {
      throw new Error(`[${avatar.name}] angle selection failed: ${err.message}`)
    }

    // Generate scripts twice in parallel — same topic, same angle, different context depth
    // Summary: structured findings only (cheap); Full: + raw tool call results (richer detail)
    let summaryResult, fullResult
    try {
      ;[summaryResult, fullResult] = await Promise.all([
        generateScripts(avatar, videoTypes, { chosenAngle, findings: research.findings }),
        generateScripts(avatar, videoTypes, { chosenAngle, findings: research.findings, rawSources: research.toolCalls }),
      ])
      logger.info(`  Title: ${summaryResult.title}`)
    } catch (err) {
      throw new Error(`[${avatar.name}] script generation failed: ${err.message}`)
    }

    // Run Haiku critique pass on both sets of scripts in parallel to remove AI tells
    try {
      ;[summaryResult.scripts, fullResult.scripts] = await Promise.all([
        critiqueScripts(avatar, videoTypes, summaryResult.scripts),
        critiqueScripts(avatar, videoTypes, fullResult.scripts),
      ])
    } catch (err) {
      logger.warn(`[${avatar.name}] critique failed, using uncritiqued scripts: ${err.message}`)
    }

    const { title, scripts } = summaryResult

    // Save research report and single transcript file
    let transcriptPath
    try {
      const researchPath = await saveResearch(avatar, research)
      logger.info(`Research saved: ${researchPath}`)

      transcriptPath = await saveTranscripts(avatar, title, scripts, videoTypes, summaryResult.productionNotes)
      logger.info(`Transcript saved: ${transcriptPath}`)
    } catch (err) {
      throw new Error(`[${avatar.name}] saving output failed: ${err.message}`)
    }

    // Email both analyses so we can compare how context depth affects script output
    if (avatar.outputValidators?.length) {
      const buildSection = (heading, result) => {
        const scriptBlocks = Object.entries(result.scripts)
          .map(([typeId, script]) => {
            const label = videoTypes[typeId]?.label ?? typeId
            const notes = result.productionNotes?.[typeId]
            const notesBlock = notes
              ? '\n\n' + Object.entries(notes)
                  .map(([k, v]) => `> **${k}:** ${v}`)
                  .join('\n')
              : ''
            return `### ${label}\n\n${script}${notesBlock}`
          })
          .join('\n\n---\n\n')
        return [`## ${heading}`, scriptBlocks].join('\n\n')
      }

      const emailBody = [
        `# ${avatar.name} — ${title}`,
        buildSection('Summary Analysis', summaryResult),
        '---',
        buildSection('Full Analysis', fullResult),
        '---',
        `## Setup`,
        `**Angle:** ${chosenAngle.angle}`,
        `*${chosenAngle.rationale}*`,
        '',
        `## Research\n\n${renderFindingsMarkdown(research.findings)}`,
      ].join('\n\n')

      for (const email of avatar.outputValidators) {
        try {
          await sendEmail(avatar.fromEmail, email, `[${avatar.name}] ${title}`, emailBody)
        } catch (err) {
          logger.warn(`Failed to email ${email}: ${err.message}`)
        }
      }
    }

    // Submit one video per type per analysis — both summary and full while we evaluate which to keep
    const submissions = []
    const toSubmit = [
      { analysis: 'summary', scripts: summaryResult.scripts },
      { analysis: 'full', scripts: fullResult.scripts },
    ]
    for (const { analysis, scripts: analysisScripts } of toSubmit) {
      for (const [typeId, script] of Object.entries(analysisScripts)) {
        const label = videoTypes[typeId]?.label ?? typeId
        const videoTitle = `${title} (${label} — ${analysis})`
        try {
          const orientation = videoTypes[typeId]?.orientation
          const submission = await generator.submit(script, avatar, { title: videoTitle, dryRun, typeId, orientation })
          logger.info(`Video submitted (${analysis}/${typeId}): ${submission.videoId}`)
          submissions.push({ analysis, typeId, ...submission })
        } catch (err) {
          throw new Error(`[${avatar.name}] video submission failed for ${analysis}/${typeId}: ${err.message}`)
        }
      }
    }

    results.push({
      avatar: avatar.name,
      avatarId: avatar.id,
      title,
      transcriptPath,
      submissions,
    })
  }

  const digestPath = await saveDigest(results)
  logger.info(`Digest saved: ${digestPath}`)

  return { results, digestPath }
}
