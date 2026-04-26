import * as heygen from '@rossi-bot/heygen'
import { logger } from '@rossi-bot/core-platform'

// Generator map mirrors runner.js — keep in sync as new generators are added
const generators = { heygen }

export function registerStatusCommand(program) {
  program
    .command('status <videoId>')
    .description('Check the status of a submitted video')
    .option('-g, --generator <name>', 'Which generator to query', 'heygen')
    .action(async (videoId, options) => {
      try {
        const generator = generators[options.generator]
        if (!generator) {
          console.error(`Unknown generator: ${options.generator}`)
          process.exit(1)
        }

        const result = await generator.getStatus(videoId)
        console.log(`Video ID: ${result.videoId}`)
        console.log(`Status:   ${result.status}`)
        if (result.url) console.log(`URL:      ${result.url}`)
      } catch (err) {
        logger.error('Status check failed:', err.message)
        process.exit(1)
      }
    })
}
