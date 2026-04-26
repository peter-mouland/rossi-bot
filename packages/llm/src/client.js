import Anthropic from '@anthropic-ai/sdk'
import { getConfig } from '@rossi-bot/core-platform'

let _client = null

export function getClient() {
  if (!_client) {
    const { anthropicApiKey } = getConfig()
    _client = new Anthropic({ apiKey: anthropicApiKey })
  }
  return _client
}
