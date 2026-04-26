import { getConfig } from '@rossi-bot/core-platform'

export async function searchWeb({ query, maxResults = 10, region = 'us' }) {
  const { braveApiKey } = getConfig()

  const url = new URL('https://api.search.brave.com/res/v1/web/search')
  url.searchParams.set('q', query)
  url.searchParams.set('count', String(maxResults))
  url.searchParams.set('country', region.toLowerCase())

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': braveApiKey,
    },
  })

  if (!response.ok) {
    throw new Error(`Brave Search API error ${response.status}: ${await response.text()}`)
  }

  const data = await response.json()
  return (data.web?.results ?? []).map(result => ({
    title: result.title,
    url: result.url,
    description: result.description,
  }))
}
