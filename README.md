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

### API Keys

| Key | Where to get it |
|-----|----------------|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `YOUTUBE_API_KEY` | Google Cloud Console — enable YouTube Data API v3 |
| `BRAVE_SEARCH_API_KEY` | [brave.com/search/api](https://brave.com/search/api) — free tier available |
| `HEYGEN_API_KEY` | HeyGen account settings |

## Running

Generate scripts and submit videos for all avatars:

```bash
pnpm --filter @rossi-bot/cli dev run
```

Run for a specific avatar only:

```bash
pnpm --filter @rossi-bot/cli dev run --avatar rossi
```

Check the status of a submitted video:

```bash
pnpm --filter @rossi-bot/cli dev status <videoId>
```

Print the latest daily digest:

```bash
pnpm --filter @rossi-bot/cli dev digest
```

## Output

| File | Description |
|------|-------------|
| `packages/avatars/<id>/transcripts/<date>.md` | Generated script for that avatar |
| `output/digests/<date>.md` | Summary of all video submissions for the day |

## Adding an Avatar

1. Create `packages/avatars/<id>/config.json` — see `packages/avatars/rossi/config.json` as a reference
2. Fill in `heygenAvatarId`, `heygenVoiceId`, `toneOfVoice`, `topicOfExpertise`, and `subTopics`
3. It will be picked up automatically on the next run
