async function search({ tag, maxResults = 10 }) {
  const url = new URL('https://dev.to/api/articles')
  url.searchParams.set('tag', tag.toLowerCase().replace(/\s+/g, ''))
  url.searchParams.set('per_page', String(maxResults))
  url.searchParams.set('top', '7') // top articles from the past 7 days

  const res = await fetch(url, { headers: { 'User-Agent': 'rossi-bot/1.0' } })
  if (!res.ok) throw new Error(`Dev.to error: ${res.status}`)

  const articles = await res.json()
  return {
    tag,
    results: articles.map(a => ({
      title: a.title,
      url: a.url,
      author: a.user.name,
      tags: a.tag_list,
      reactions: a.positive_reactions_count,
      comments: a.comments_count,
      publishedAt: a.published_at,
    })),
  }
}

export const guidance = 'search_devto — trending developer articles by tag (e.g. "react", "typescript", "css")'

export const definition = {
  name: 'search_devto',
  description:
    'Find trending developer articles on Dev.to by tag. ' +
    'Returns the most-reacted posts from the past 7 days. Best for frontend, React, TypeScript, CSS topics.',
  input_schema: {
    type: 'object',
    properties: {
      tag: { type: 'string', description: 'Dev.to tag to search (e.g. "react", "typescript", "css", "webdev")' },
      maxResults: { type: 'number', description: 'Number of results to return (default: 10)' },
    },
    required: ['tag'],
  },
}

export const execute = (input) => search(input)
