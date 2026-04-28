import { getConfig } from '@rossi-bot/core-platform'

async function search({ query, maxResults = 10, region = 'us' }) {
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
  return (data.web?.results ?? []).map(r => ({
    title: r.title,
    url: r.url,
    description: r.description,
  }))
}

export const guidance = 'search_web — broad web search for news, articles, expert commentary'

export const definition = {
  name: 'search_web',
  description:
    'Search the web for articles, news, and content on a topic. ' +
    'Use for broader research — opinions, analysis, recent news — beyond YouTube.',
  input_schema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      maxResults: { type: 'number', description: 'Number of results to return (default: 10)' },
    },
    required: ['query'],
  },
}

export const execute = (input, { region } = {}) => search({ ...input, region })
