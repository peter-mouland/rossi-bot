import { searchRss } from './rss.js'

export const guidance = 'search_thisismoney — UK personal finance news from This Is Money'

export const definition = {
  name: 'search_thisismoney',
  description: 'Fetch recent articles from This Is Money — UK personal finance, savings, mortgages, and investing.',
  input_schema: {
    type: 'object',
    properties: {
      keyword: { type: 'string', description: 'Optional keyword to filter results' },
      maxResults: { type: 'number', description: 'Number of results to return (default: 10)' },
    },
    required: [],
  },
}

export const execute = (input) => searchRss({ ...input, url: 'https://www.thisismoney.co.uk/money/index.rss' })
