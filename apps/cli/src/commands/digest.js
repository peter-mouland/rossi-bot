import { readFile, readdir } from 'fs/promises'
import { join } from 'path'

export function registerDigestCommand(program) {
  program
    .command('digest')
    .description('Print the most recent daily digest')
    .action(async () => {
      try {
        const digestDir = join(process.cwd(), process.env.OUTPUT_DIR ?? 'output', 'digests')
        const files = await readdir(digestDir).catch(() => [])

        if (!files.length) {
          console.log('No digests yet. Run `rossi run` first.')
          return
        }

        const latest = files.sort().at(-1)
        const content = await readFile(join(digestDir, latest), 'utf-8')
        console.log(content)
      } catch (err) {
        console.error('Failed to read digest:', err.message)
        process.exit(1)
      }
    })
}
