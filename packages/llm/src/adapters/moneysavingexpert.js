import { searchRss } from './rss.js'

export const guidance = 'search_moneysavingexpert — UK personal finance tips and deals from MoneySavingExpert'

export const definition = {
  name: 'search_moneysavingexpert',
  description: 'Fetch recent articles from MoneySavingExpert — UK personal finance tips, deals, and consumer news.',
  input_schema: {
    type: 'object',
    properties: {
      keyword: { type: 'string', description: 'Optional keyword to filter results' },
      maxResults: { type: 'number', description: 'Number of results to return (default: 10)' },
    },
    required: [],
  },
}

export const execute = (input) => searchRss({ ...input, url: 'https://www.moneysavingexpert.com/news/feeds/news.rss' })
