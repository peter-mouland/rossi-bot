async function search({ query, maxResults = 10 }) {
  const url = new URL('https://hn.algolia.com/api/v1/search')
  url.searchParams.set('query', query)
  url.searchParams.set('tags', 'story')
  url.searchParams.set('hitsPerPage', String(maxResults))

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Hacker News search failed: ${res.status}`)

  const data = await res.json()
  return {
    query,
    results: data.hits.map(h => ({
      title: h.title,
      url: h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`,
      points: h.points,
      comments: h.num_comments,
      author: h.author,
      date: h.created_at,
    })),
  }
}

export const guidance = 'search_hacker_news — engineering community stories, technical discussions, developer opinion'

export const definition = {
  name: 'search_hacker_news',
  description:
    'Search Hacker News for stories, discussions, and technical articles. ' +
    'Best for engineering trends, developer tools, and technical community opinion.',
  input_schema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      maxResults: { type: 'number', description: 'Number of results to return (default: 10)' },
    },
    required: ['query'],
  },
}

export const execute = (input) => search(input)
