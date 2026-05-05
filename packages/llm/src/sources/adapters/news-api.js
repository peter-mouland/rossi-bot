function sevenDaysAgo() {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString().split('T')[0]
}

async function search({ query, maxResults = 5 }) {
  const apiKey = process.env.NEWS_API_KEY
  if (!apiKey) throw new Error('Missing NEWS_API_KEY')

  const url = new URL('https://newsapi.org/v2/everything')
  url.searchParams.set('q', query)
  url.searchParams.set('language', 'en')
  url.searchParams.set('sortBy', 'publishedAt')
  url.searchParams.set('from', sevenDaysAgo())
  url.searchParams.set('pageSize', String(maxResults))
  url.searchParams.set('apiKey', apiKey)

  const res = await fetch(url)
  if (!res.ok) throw new Error(`NewsAPI error: ${res.status}`)

  const data = await res.json()
  if (data.status !== 'ok') throw new Error(`NewsAPI error: ${data.message}`)

  return {
    query,
    results: data.articles.map(a => ({
      title: a.title,
      source: a.source.name,
      url: a.url,
      description: a.description,
      publishedAt: a.publishedAt,
    })),
  }
}

export const guidance = 'search_news_api — recent articles from major news publishers, sorted by recency'

export const definition = {
  name: 'search_news_api',
  description:
    'Search recent news articles from major publishers via NewsAPI. ' +
    'Best for timely news — finance, economics, current affairs. Sorted by most recent.',
  input_schema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      maxResults: { type: 'number', description: 'Number of results to return (default: 5)' },
    },
    required: ['query'],
  },
}

export const execute = (input) => search(input)
