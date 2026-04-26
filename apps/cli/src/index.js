#!/usr/bin/env node
import dotenv from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '../../../.env') })
import { Command } from 'commander'
import { registerRunCommand } from './commands/run.js'
import { registerDigestCommand } from './commands/digest.js'
import { registerStatusCommand } from './commands/status.js'

const program = new Command()

program
  .name('rossi')
  .description('Rossi Bot — automated avatar video generation')
  .version('0.1.0')

registerRunCommand(program)
registerDigestCommand(program)
registerStatusCommand(program)

program.parseAsync()
