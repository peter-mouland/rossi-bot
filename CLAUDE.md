# Rossi Bot

Automated avatar video generation pipeline. Each night it researches trending content per avatar, generates a video script via Claude, and submits to a video generation service (HeyGen or others).

## Architecture

pnpm monorepo. Plain JavaScript ESM throughout. No TypeScript, no Zod.

### Packages

| Package | Path | Role |
|---------|------|------|
| core-platform | `packages/core-platform` | Shared config, logging, file I/O |
| avatars | `packages/avatars` | Avatar config files and loader |
| llm | `packages/llm` | Claude wrapper + search tools (content discovery) |
| heygen | `packages/heygen` | HeyGen video generator adapter |

### Apps

| App | Path | Role |
|-----|------|------|
| cli | `apps/cli` | Nightly runner + commands |
| web | `apps/web` | Future web dashboard (stubbed) |

## Standards

- **Language:** Plain JavaScript ESM — `"type": "module"` in every `package.json`
- **Package manager:** pnpm with workspaces (`pnpm-workspace.yaml`)
- **Test runner:** Vitest
- **No TypeScript** — add only if complexity warrants it
- **No Zod** — validate at system boundaries only (env vars, external API responses)
- **Node built-ins** preferred over npm packages (`fetch`, `fs/promises`, `path`, `url`)
- Each package exports only from `src/index.js`
- No barrel re-exports — import directly from the package name

## Generator Adapter Contract

Every video generator package must export these functions:

```js
// Submit transcript for rendering. Returns { videoId, status }
export async function submit(transcript, avatar) {}

// Check status of a submitted video. Returns { videoId, status, url }
export async function getStatus(videoId) {}

// Poll until complete or timeout. Returns { videoId, status, url }
export async function waitForCompletion(videoId, options) {}
```

The `avatar` config selects the generator via `"generator": "heygen"`.
The CLI maps that string to the package at `apps/cli/src/runner.js`.

## Adding a New Avatar

1. Create `packages/avatars/<id>/config.json`
2. Required fields: `id`, `name`, `generator`, `toneOfVoice`, `topicOfExpertise`, `subTopics[]`
3. Add `anglePreference` — a plain-English editorial rule used to pick the best angle from research candidates (e.g. `"Always lead with the practitioner angle — lived experience, not theory"`)
4. Add generator-specific fields (e.g. `heygenAvatarId`, `heygenVoiceId`)
5. Optional: `fromEmail` — sender address for this avatar (must be verified in Resend)
6. Optional: `outputValidators[]` — array of email addresses to receive the transcript after each run
7. All avatar-specific files (prompts, assets, overrides) live in that same directory

## Adding a New Generator

1. Create `packages/<name>/package.json` and `packages/<name>/src/index.js`
2. Implement the generator contract above
3. Register in `apps/cli/src/runner.js`: add to the `generators` map

## Adding a New Search Tool

Each adapter is fully self-contained. Create `packages/llm/src/sources/adapters/<name>.js` exporting:

```js
export const guidance = 'search_name — one-line description for the research prompt'

export const definition = {
  name: 'search_name',          // tool name Claude will call
  description: '...',           // description for Claude tool use
  input_schema: { ... },        // JSON Schema for inputs
}

export const execute = (input, ctx) => { ... }  // ctx has { region }
```

Then register it in `packages/llm/src/sources/index.js`:

```js
import * as mySource from './adapters/<name>.js'

const SOURCES = {
  // ...existing sources...
  'my-source': mySource,
}
```

Add `"my-source"` to the avatar's `newsSources` array to enable it.

### RSS-backed adapters

For RSS feeds, import `searchRss` from `./rss.js` and call it with a hardcoded URL:

```js
import { searchRss } from './rss.js'
export const execute = (input) => searchRss({ ...input, url: 'https://example.com/rss' })
```

Adapters should default `maxResults` to 5. Claude requests more explicitly if needed.

### Available sources

| Source id | Adapter | Notes |
|-----------|---------|-------|
| `web` | `brave.js` | Requires `BRAVE_SEARCH_API_KEY` |
| `youtube` | `youtube.js` | Requires `YOUTUBE_API_KEY` |
| `hacker-news` | `hacker-news.js` | Free, no key |
| `news-api` | `news-api.js` | Requires `NEWS_API_KEY` |
| `devto` | `devto.js` | Free, no key |
| `moneysavingexpert` | `moneysavingexpert.js` | RSS, free |
| `bbc-business` | `bbc-business.js` | RSS, free |
| `thisismoney` | `thisismoney.js` | RSS, free |
| `wikipedia` | `wikipedia.js` | Free, no key |

## Pipeline (per avatar, nightly)

```
1. llm.runResearch(avatar, { researchMode })
   └── Agentic loop: Claude calls newsSources tools, then report_findings
       → { sources[], trendingTopics[], candidateAngles[] }

2. llm.selectAngle(avatar, findings)
   └── Haiku call with tool_choice: forces select_angle tool
       Uses avatar.anglePreference to pick one candidateAngle
       → { angle, rationale, selectionRationale }

3. llm.generateScripts(avatar, videoTypes, { chosenAngle, findings })
   └── Opus call: writes teaser + summary + deep-dive on the chosen angle
       → { title, scripts: { teaser, summary, deep-dive } }

4. core-platform.saveResearch(avatar, research)
   └── packages/avatars/<id>/research/<date>.md

5. core-platform.saveTranscripts(avatar, title, scripts, videoTypes)
   └── packages/avatars/<id>/transcripts/<date>-<slug>.md

6. generator.submit(teaserScript, avatar)
   └── submits to video service → returns { videoId }

7. sendEmail(fromEmail, validator, subject, body)
   └── emails transcript + chosen angle + research to each outputValidator

8. core-platform.saveDigest(results)
   └── output/digests/<date>.md
```

## CLI Commands

```bash
# Run the full pipeline for all avatars
pnpm --filter @rossi-bot/cli dev -- run

# Run for a single avatar
pnpm --filter @rossi-bot/cli dev -- run --avatar aria

# Compare research quality: full raw JSON vs compact summaries passed to Claude
pnpm --filter @rossi-bot/cli dev -- run --avatar aria --research-mode full
pnpm --filter @rossi-bot/cli dev -- run --avatar aria --research-mode summary
```

`--research-mode` controls how tool results are injected into the research conversation:
- `summary` (default) — compact bullet list (~80 tokens per call); prevents context overflow on avatars with many sources
- `full` — raw `JSON.stringify` of the complete result set (~800 tokens per call); use to compare research depth or debug tool output

```bash
# Skip video submission (research + scripts only)
DRY_RUN=true pnpm --filter @rossi-bot/cli dev -- run

# Verbose logging
LOG_LEVEL=debug pnpm --filter @rossi-bot/cli dev -- run --avatar pete
```

## Agent Readiness

The pipeline is built to evolve into a full agent. Seams to watch:

- **`packages/llm`** — already uses Claude tool use for content discovery. More tools = more capable agent.
- **`apps/cli/src/runner.js`** — the for-loop over avatars is the future agent orchestration point.
- **Generator adapters** — each is independently tool-callable.

## Environment Variables

```
ANTHROPIC_API_KEY=       Claude API key
YOUTUBE_API_KEY=         YouTube Data API v3
BRAVE_SEARCH_API_KEY=    Brave Search API
HEYGEN_API_KEY=          HeyGen API key
NEWS_API_KEY=            NewsAPI key (newsapi.org)
RESEND_API_KEY=          Resend API key
LOG_LEVEL=info           debug | info | warn | error
OUTPUT_DIR=output        Where transcripts and digests are written
```

## Output Structure

```
packages/avatars/<id>/
  config.json
  research/
    <date>.md                     Research findings + tool call log
  transcripts/
    <date>-<title-slug>.md        All three formats in one file (teaser, summary, deep-dive)

output/
  digests/
    <date>.md                     Summary of all video submissions
```
