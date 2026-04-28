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
3. Add generator-specific fields (e.g. `heygenAvatarId`, `heygenVoiceId`)
4. Optional: `fromEmail` — sender address for this avatar (must be verified in Resend)
5. Optional: `outputValidators[]` — array of email addresses to receive the transcript after each run
5. All avatar-specific files (prompts, assets, overrides) live in that same directory

## Adding a New Generator

1. Create `packages/<name>/package.json` and `packages/<name>/src/index.js`
2. Implement the generator contract above
3. Register in `apps/cli/src/runner.js`: add to the `generators` map

## Adding a New Search Tool

1. Create adapter at `packages/llm/src/adapters/<name>.js`
2. Add tool definition to `toolDefinitions` in `packages/llm/src/tools.js`
3. Add a case to the `executeTool()` switch statement

## Pipeline (per avatar, nightly)

```
1. llm.generateTranscript(avatar)
   └── Claude uses search tools to find trending content → writes script in avatar's voice

2. core-platform.saveTranscript(avatar, transcript)
   └── output/transcripts/<date>/<avatarId>.md

3. generator.submit(transcript, avatar)
   └── submits to video service → returns { videoId }

4. core-platform.saveDigest(results)
   └── output/digests/<date>.md
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
RESEND_API_KEY=          Resend API key
LOG_LEVEL=info           debug | info | warn | error
OUTPUT_DIR=output        Where transcripts and digests are written
```

## Output Structure

```
packages/avatars/<id>/
  config.json
  transcripts/
    <date>.md            One script per run, stored with the avatar

output/
  digests/
    <date>.md            Summary of all video submissions
```
