import { run } from '../runner.js'
import { logger } from '@rossi-bot/core-platform'

export function registerRunCommand(program) {
  program
    .command('run')
    .description('Research trending content, generate scripts, and submit videos')
    .option('-a, --avatar <id>', 'Run for a specific avatar only')
    .option('-t, --type <type>', 'Video type to generate (teaser, summary, deep-dive)', 'teaser')
    .action(async options => {
      try {
        const { results, digestPath } = await run({ avatarId: options.avatar, type: options.type })

        console.log(`\n${results.length} video(s) submitted.`)
        console.log(`Digest: ${digestPath}\n`)

        for (const r of results) {
          console.log(`  ${r.avatar}`)
          console.log(`    Video ID:   ${r.videoId}`)
          console.log(`    Status:     ${r.status}`)
          console.log(`    Transcript: ${r.transcriptPath}`)
          console.log()
        }
      } catch (err) {
        logger.error(`Run failed: ${err.message}`)
        if (process.env.LOG_LEVEL === 'debug') logger.debug(err.stack)
        process.exit(1)
      }
    })
}
