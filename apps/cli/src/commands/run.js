import { run } from '../runner.js'
import { logger } from '@rossi-bot/core-platform'

export function registerRunCommand(program) {
  program
    .command('run')
    .description('Research trending content, generate scripts, and submit videos')
    .option('-a, --avatar <id>', 'Run for a specific avatar only')
    .option('--research-mode <mode>', 'Tool result format passed to Claude: full (raw JSON) or summary (compact bullets)', 'summary')
    .action(async options => {
      try {
        const { results, digestPath } = await run({ avatarId: options.avatar, researchMode: options.researchMode })

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
