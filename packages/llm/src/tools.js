import { searchGoogleTrends } from './adapters/google-trends.js'
import { searchYouTube } from './adapters/youtube.js'
import { searchWeb } from './adapters/brave.js'

export const toolDefinitions = [
  {
    name: 'search_google_trends',
    description:
      'Find trending and rising topics related to a keyword using Google Trends. ' +
      'Use this first to identify which sub-topics are currently spiking in interest.',
    input_schema: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: 'The keyword or topic to get trend data for',
        },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'search_youtube',
    description:
      'Search YouTube for top videos on a topic. Returns titles, channels, descriptions, and links. ' +
      'Use this to find the most-viewed content on a trending topic.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        maxResults: {
          type: 'number',
          description: 'Number of results to return (default: 10, max: 20)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_web',
    description:
      'Search the web for articles, news, and content on a topic. ' +
      'Use for broader research — opinions, analysis, recent news — beyond YouTube.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        maxResults: {
          type: 'number',
          description: 'Number of results to return (default: 10)',
        },
      },
      required: ['query'],
    },
  },
]

export async function executeTool(name, input, { region = 'US' } = {}) {
  switch (name) {
    case 'search_google_trends':
      return searchGoogleTrends({ ...input, region })
    case 'search_youtube':
      return searchYouTube({ ...input, region })
    case 'search_web':
      return searchWeb({ ...input, region })
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}
