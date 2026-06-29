import { readFile } from 'fs/promises'
import { resolve } from 'path'
import { logger, parseTranscript, loadVideoTypes } from '@rossi-bot/core-platform'
import { loadAvatars } from '@rossi-bot/avatars'
import * as heygen from '@rossi-bot/heygen'

const generators = { heygen }

export function registerSubmitCommand(program) {
  program
    .command('submit')
    .description('Submit a saved transcript to the video generator')
    .requiredOption('-a, --avatar <id>', 'Avatar id (e.g. aria)')
    .requiredOption('-t, --transcript <path>', 'Path to the transcript markdown file')
    .option('--dry-run', 'Skip actual submission', false)
    .action(async options => {
      try {
        const avatars = await loadAvatars()
        const avatar = avatars.find(a => a.id === options.avatar)
        if (!avatar) throw new Error(`Unknown avatar: ${options.avatar}`)

        const generator = generators[avatar.generator]
        if (!generator) throw new Error(`Unknown generator: ${avatar.generator}`)

        const transcriptPath = resolve(options.transcript)
        const markdown = await readFile(transcriptPath, 'utf-8')
        const { title, scripts } = parseTranscript(markdown)

        console.log(`\nSubmitting "${title}" for ${avatar.name}\n`)

        const dryRun = options.dryRun || process.env.DRY_RUN === 'true'
        if (dryRun) logger.info('[DRY RUN] Video submission will be skipped')

        const videoTypes = await loadVideoTypes()

        for (const [typeId, script] of Object.entries(scripts)) {
          if (!script) continue
          const videoTitle = `${title} (${typeId})`
          const orientation = videoTypes[typeId]?.orientation
          try {
            const result = await generator.submit(script, avatar, { title: videoTitle, dryRun, typeId, orientation })
            console.log(`  ${typeId.padEnd(12)} ${result.videoId}  (${result.status})`)
          } catch (err) {
            throw new Error(`Submission failed for ${typeId}: ${err.message}`)
          }
        }

        console.log()
      } catch (err) {
        logger.error(`Submit failed: ${err.message}`)
        if (process.env.LOG_LEVEL === 'debug') logger.debug(err.stack)
        process.exit(1)
      }
    })
}
