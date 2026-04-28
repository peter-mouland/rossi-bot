import * as web from './adapters/brave.js'
import * as youtube from './adapters/youtube.js'
import * as hackerNews from './adapters/hacker-news.js'
import * as newsApi from './adapters/news-api.js'
import * as devto from './adapters/devto.js'
import * as moneysavingexpert from './adapters/moneysavingexpert.js'
import * as bbcBusiness from './adapters/bbc-business.js'
import * as thisismoney from './adapters/thisismoney.js'
import * as wikipedia from './adapters/wikipedia.js'

// Registry of all available sources.
// Key is the source id used in avatar config `newsSources`.
// Each adapter owns its definition, guidance, and execute function.
const SOURCES = {
  web,
  youtube,
  'hacker-news': hackerNews,
  'news-api': newsApi,
  devto,
  moneysavingexpert,
  'bbc-business': bbcBusiness,
  thisismoney,
  wikipedia,
}

// Reverse map from tool name → adapter for executeTool lookups
const BY_TOOL_NAME = Object.fromEntries(
  Object.values(SOURCES).map(s => [s.definition.name, s])
)

export const DEFAULT_SOURCES = ['web', 'youtube']

export function getToolDefinitions(sources = DEFAULT_SOURCES) {
  return sources.map(id => {
    if (!SOURCES[id]) throw new Error(`Unknown news source: "${id}"`)
    return SOURCES[id].definition
  })
}

export function getSourceGuidance(id) {
  return SOURCES[id]?.guidance ?? id
}

export async function executeTool(name, input, ctx = {}) {
  const source = BY_TOOL_NAME[name]
  if (!source) throw new Error(`Unknown tool: ${name}`)
  return source.execute(input, ctx)
}
