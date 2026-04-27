import { createRequire } from 'module'

// google-trends-api is CJS — use createRequire for ESM compat
const require = createRequire(import.meta.url)
const googleTrends = require('google-trends-api')

export async function searchGoogleTrends({ keyword, region = 'US' }) {
  const startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // relatedQueries returns actual search terms people are typing.
  // relatedTopics returns Knowledge Graph entities — too specific, often empty.
  const raw = await googleTrends.relatedQueries({ keyword, startTime, geo: region })
  const parsed = JSON.parse(raw)

  // rankedList[0] = top queries, rankedList[1] = rising queries
  const top = parsed?.default?.rankedList?.[0]?.rankedKeyword ?? []
  const rising = parsed?.default?.rankedList?.[1]?.rankedKeyword ?? []

  return {
    keyword,
    region,
    top: top.slice(0, 10).map(r => ({ query: r.query, value: r.value, trend: r.formattedValue })),
    rising: rising.slice(0, 10).map(r => ({ query: r.query, value: r.value, trend: r.formattedValue })),
  }
}
