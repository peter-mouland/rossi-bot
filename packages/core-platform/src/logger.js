const levels = { debug: 0, info: 1, warn: 2, error: 3 }

function currentLevel() {
  return levels[process.env.LOG_LEVEL ?? 'info'] ?? 1
}

function log(level, ...args) {
  if (levels[level] >= currentLevel()) {
    const ts = new Date().toISOString()
    const out = level === 'error' ? console.error : console.log
    out(`[${ts}] [${level.toUpperCase()}]`, ...args)
  }
}

export const logger = {
  debug: (...args) => log('debug', ...args),
  info: (...args) => log('info', ...args),
  warn: (...args) => log('warn', ...args),
  error: (...args) => log('error', ...args),
}
