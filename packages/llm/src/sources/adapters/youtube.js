import { getConfig } from '@rossi-bot/core-platform'

function sevenDaysAgo() {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString()
}

async function search({ query, maxResults = 5, region = 'US' }) {
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
  return (data.items ?? []).map(item => ({
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    description: item.snippet.description.slice(0, 200),
    publishedAt: item.snippet.publishedAt.slice(0, 10),
    videoId: item.id.videoId,
    url: `https://youtube.com/watch?v=${item.id.videoId}`,
  }))
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

export const execute = (input, { region } = {}) => search({ ...input, region })
