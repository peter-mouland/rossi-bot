import { getConfig } from '@rossi-bot/core-platform'

export async function searchYouTube({ query, maxResults = 10, region = 'US' }) {
  const { youtubeApiKey } = getConfig()

  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('q', query)
  url.searchParams.set('maxResults', String(maxResults))
  url.searchParams.set('type', 'video')
  url.searchParams.set('order', 'viewCount')
  url.searchParams.set('regionCode', region)
  url.searchParams.set('key', youtubeApiKey)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`YouTube API error ${response.status}: ${await response.text()}`)
  }

  const data = await response.json()
  return (data.items ?? []).map(item => ({
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    description: item.snippet.description,
    publishedAt: item.snippet.publishedAt,
    videoId: item.id.videoId,
    url: `https://youtube.com/watch?v=${item.id.videoId}`,
  }))
}
