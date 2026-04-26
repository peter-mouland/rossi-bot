# API Key Setup

## Anthropic (Claude)

1. Go to `console.anthropic.com`
2. Sign up / log in
3. Settings → API Keys → Create Key

---

## YouTube Data API v3

1. Go to `console.cloud.google.com`
2. Create a new project (top-left dropdown → New Project)
3. Search "YouTube Data API v3" in the API Library → Enable
4. Go to Credentials → Create Credentials → API Key
5. Optionally click the key → Restrict it to YouTube Data API v3 only (good practice)

Free tier: 10,000 units/day. A search request costs 100 units, so ~100 searches/day.

---

## Brave Search API

1. Go to `brave.com/search/api`
2. Sign up → verify email
3. Dashboard → Create Subscription → pick the free tier (2,000 queries/month)
4. Copy the API key from the dashboard

---

## HeyGen

1. Log in at `heygen.com`
2. Click your avatar (top right) → Settings
3. API → Generate API Key

---

## Add keys to .env

```
ANTHROPIC_API_KEY=sk-ant-...
YOUTUBE_API_KEY=AIza...
BRAVE_SEARCH_API_KEY=BSA...
HEYGEN_API_KEY=...
```
