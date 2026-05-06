import { getConfig } from '@rossi-bot/core-platform'

function sevenDaysAgo() {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString()
}

async function fetchStatistics(videoIds, youtubeApiKey) {
  const url = new URL('https://www.googleapis.com/youtube/v3/videos')
  url.searchParams.set('part', 'statistics')
  url.searchParams.set('id', videoIds.join(','))
  url.searchParams.set('key', youtubeApiKey)

  const response = await fetch(url)
  if (!response.ok) return {}

  const data = await response.json()
  return Object.fromEntries(
    (data.items ?? []).map(item => [item.id, item.statistics])
  )
}

async function search({ query, maxResults = 5, region = 'US', minLikes = 1000 }) {
  const { youtubeApiKey } = getConfig()

  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('q', query)
  url.searchParams.set('maxResults', String(maxResults))
  url.searchParams.set('type', 'video')
  url.searchParams.set('order', 'viewCount')
  url.searchParams.set('regionCode', region)
  url.searchParams.set('publishedAfter', sevenDaysAgo())
  url.searchParams.set('key', youtubeApiKey)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`YouTube API error ${response.status}: ${await response.text()}`)
  }

  const data = await response.json()
  const items = data.items ?? []
  if (!items.length) return []

  const videoIds = items.map(item => item.id.videoId)
  const stats = await fetchStatistics(videoIds, youtubeApiKey)

  return items
    .map(item => {
      const s = stats[item.id.videoId] ?? {}
      return {
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        description: item.snippet.description.slice(0, 200),
        publishedAt: item.snippet.publishedAt.slice(0, 10),
        videoId: item.id.videoId,
        url: `https://youtube.com/watch?v=${item.id.videoId}`,
        likeCount: Number(s.likeCount ?? 0),
        viewCount: Number(s.viewCount ?? 0),
      }
    })
    .filter(v => v.likeCount >= minLikes)
}

export const guidance = 'search_youtube — find top videos on the most relevant trending angle'

export const definition = {
  name: 'search_youtube',
  description:
    'Search YouTube for top videos on a topic. Returns titles, channels, descriptions, and links. ' +
    'Use this to find the most-viewed content on a trending topic.',
  input_schema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      maxResults: { type: 'number', description: 'Number of results to return (default: 5)' },
    },
    required: ['query'],
  },
}

export const execute = (input, { region, youtubeMinLikes } = {}) =>
  search({ ...input, region, ...(youtubeMinLikes != null && { minLikes: youtubeMinLikes }) })
