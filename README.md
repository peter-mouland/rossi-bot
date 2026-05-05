# Rossi Bot

Automated avatar video generation pipeline. Each night it researches trending content per avatar, generates a video script via Claude, and submits to HeyGen for rendering.

## Setup

```bash
pnpm install
cp .env.example .env
```

Edit `.env` with your API keys:

```
ANTHROPIC_API_KEY=your_key
YOUTUBE_API_KEY=your_key
BRAVE_SEARCH_API_KEY=your_key
HEYGEN_API_KEY=your_key
```

See `docs/setup.md` for instructions on obtaining each key.

## Running

Generate scripts and submit videos for all avatars:

```bash
pnpm --filter @rossi-bot/cli dev run
```

Run for a specific avatar only:

```bash
pnpm --filter @rossi-bot/cli dev run --avatar rossi
```

Specify a video type:

```bash
pnpm --filter @rossi-bot/cli dev run --avatar rossi --type teaser
pnpm --filter @rossi-bot/cli dev run --avatar rossi --type summary
pnpm --filter @rossi-bot/cli dev run --avatar rossi --type deep-dive
```

Check the status of a submitted video:

```bash
pnpm --filter @rossi-bot/cli dev status <videoId>
```

Print the latest daily digest:

```bash
pnpm --filter @rossi-bot/cli dev digest
```

## Pipeline

```
Avatar Config
     │
     ▼
runResearch (once, summary mode)
  └── news APIs called once
  └── findings + toolCalls (raw results stored)
     │
     ▼
selectAngle (once — same angle for both)
     │
     ├─────────────────────────────────────────┐
     ▼                                         ▼
generateScripts                      generateScripts
  findings only                        findings + rawSources
  (structured summaries)               (full JSON tool results)
     │                                         │
     ▼                                         ▼
"Summary Analysis"                   "Full Analysis"
  in email                             in email
     │
     ▼
HeyGen submission (summary scripts)
```

## Video Types

Defined in `config/video-types.json`. Add or edit types there — no code changes needed.

| Type | Duration | Use case |
|------|----------|----------|
| `teaser` | 10s | Punchy single insight to grab attention |
| `summary` | 60s | Concise overview of a trending topic |
| `deep-dive` | 8min | Comprehensive exploration with context and analysis |

Default type is `teaser`.

## Output

| File | Description |
|------|-------------|
| `packages/avatars/<id>/transcripts/<date>.md` | Generated script, stored with the avatar |
| `output/digests/<date>.md` | Summary of all video submissions for the day |

## Adding an Avatar

1. Create `packages/avatars/<id>/config.json` — see `packages/avatars/rossi/config.json` as a reference
2. Fill in `heygenAvatarId`, `heygenVoiceId`, `toneOfVoice`, `topicOfExpertise`, `subTopics`, and `region`
3. It will be picked up automatically on the next run

## Adding a Video Type

1. Add an entry to `config/video-types.json` with `label`, `durationSeconds`, `approxWords`, and `description`
2. Use it immediately with `--type <key>`

# todo

full integrtion with RSS feeds found here: https://rss.feedspot.com/
