import { createRequire } from 'module'

// google-trends-api is CJS — use createRequire for ESM compat
const require = createRequire(import.meta.url)
const googleTrends = require('google-trends-api')

export async function searchGoogleTrends({ keyword, region = 'US' }) {
  const startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const raw = await googleTrends.relatedTopics({ keyword, startTime, geo: region })
  const parsed = JSON.parse(raw)

  const rising = parsed?.default?.rankedList?.[0]?.rankedKeyword ?? []
  const top = parsed?.default?.rankedList?.[1]?.rankedKeyword ?? []

  return {
    keyword,
    rising: rising.slice(0, 10).map(r => ({ topic: r.topic?.title, value: r.value })),
    top: top.slice(0, 10).map(r => ({ topic: r.topic?.title, value: r.value })),
  }
}
