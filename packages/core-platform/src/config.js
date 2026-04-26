function requireEnv(key) {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

export function getConfig() {
  return {
    anthropicApiKey: requireEnv('ANTHROPIC_API_KEY'),
    youtubeApiKey: requireEnv('YOUTUBE_API_KEY'),
    braveApiKey: requireEnv('BRAVE_SEARCH_API_KEY'),
    heygenApiKey: requireEnv('HEYGEN_API_KEY'),
    logLevel: process.env.LOG_LEVEL ?? 'info',
    outputDir: process.env.OUTPUT_DIR ?? 'output',
  }
}
