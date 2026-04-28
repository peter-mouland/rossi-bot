async function search({ query, maxResults = 5 }) {
  const url = new URL('https://en.wikipedia.org/w/api.php')
  url.searchParams.set('action', 'query')
  url.searchParams.set('list', 'search')
  url.searchParams.set('srsearch', query)
  url.searchParams.set('srlimit', String(maxResults))
  url.searchParams.set('srprop', 'snippet|titlesnippet')
  url.searchParams.set('format', 'json')
  url.searchParams.set('origin', '*')

  const res = await fetch(url, { headers: { 'User-Agent': 'rossi-bot/1.0' } })
  if (!res.ok) throw new Error(`Wikipedia search failed: ${res.status}`)

  const data = await res.json()
  return {
    query,
    results: data.query.search.map(r => ({
      title: r.title,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(r.title.replace(/ /g, '_'))}`,
      snippet: r.snippet.replace(/<[^>]+>/g, ''),
    })),
  }
}

export const guidance = 'search_wikipedia — background context and definitions; use after choosing an angle'

export const definition = {
  name: 'search_wikipedia',
  description:
    'Search Wikipedia for background context, definitions, and factual grounding on a topic. ' +
    'Use after identifying the angle to add depth and credibility.',
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
