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
5. Optionally restrict the key to YouTube Data API v3 only

Free tier: 10,000 units/day. A search request costs 100 units (~100 searches/day).

---

## Brave Search API

1. Go to `brave.com/search/api`
2. Sign up → verify email
3. Dashboard → Create Subscription → pick the free tier (2,000 queries/month)
4. Copy the API key from the dashboard

---

## NewsAPI

1. Go to `newsapi.org`
2. Sign up → verify email → copy the API key from the dashboard

Free tier: 100 requests/day, articles from the past month, no production use.

---

## HeyGen

1. Log in at `heygen.com`
2. Click your avatar (top right) → Settings → API → Generate API Key

---

## Resend (email)

1. Go to `resend.com` and sign up
2. API Keys → Create API Key
3. Domains → Add Domain → add `the-gist.uk` and apply the DNS records in Cloudflare
4. Once verified, avatar `fromEmail` addresses (e.g. `aria@the-gist.uk`) will work

---

## No key required

The following sources are free and need no API key:

- **Hacker News** — Algolia HN Search API
- **Dev.to** — public Forem API
- **MoneySavingExpert, BBC Business, This Is Money** — public RSS feeds
- **Wikipedia** — MediaWiki API

---

## Add keys to .env

```
ANTHROPIC_API_KEY=sk-ant-...
YOUTUBE_API_KEY=AIza...
BRAVE_SEARCH_API_KEY=BSA...
NEWS_API_KEY=...
HEYGEN_API_KEY=...
RESEND_API_KEY=re_...
```
