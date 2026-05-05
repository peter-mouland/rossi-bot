import { searchRss } from './rss.js'

export const guidance = 'search_bbc_business — UK and global business news from BBC'

export const definition = {
  name: 'search_bbc_business',
  description: 'Fetch recent articles from BBC Business News — UK and global business and economic news.',
  input_schema: {
    type: 'object',
    properties: {
      keyword: { type: 'string', description: 'Optional keyword to filter results' },
      maxResults: { type: 'number', description: 'Number of results to return (default: 5)' },
    },
    required: [],
  },
}

export const execute = (input) => searchRss({ ...input, url: 'https://feeds.bbci.co.uk/news/business/rss.xml' })
