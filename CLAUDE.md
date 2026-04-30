# Storista

A free, no-login web app that generates short illustrated-style 4-page bedtime stories for kids. The customer types an idea (e.g. "a shy fox who finds a glowing stone") and picks an age range; the server calls OpenRouter to write the story.

## Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS v4
- OpenRouter for the LLM (default model: `google/gemini-2.5-flash`)
- Lumen Pro (MCP-over-HTTP) for cover illustrations (default model: `imagen-4`, 6 credits)
- No database, no auth — public service

## Structure

- `src/app/page.tsx` — single-page UI (idea form + 4-page story viewer with cover)
- `src/app/api/generate/route.ts` — POST endpoint: calls OpenRouter for the story, then Lumen for a cover image. Returns `{ title, pages, coverImageUrl }`
- `src/lib/lumen.ts` — minimal MCP-over-HTTP client for Lumen Pro (`generateCoverImage`)
- `src/app/globals.css` — dark theme + gradient utilities
- `src/app/layout.tsx` — root layout & metadata

## Environment

Copy `.env.local.example` → `.env.local` and fill in:

- `OPENROUTER_API_KEY` (required) — get one at https://openrouter.ai/keys
- `OPENROUTER_MODEL` (optional) — defaults to `google/gemini-2.5-flash`
- `OPENROUTER_SITE_URL`, `OPENROUTER_SITE_NAME` (optional, used by OpenRouter for attribution)
- `LUMEN_TOKEN` (optional) — bearer token from https://app.lumenpro.io. Without it, stories are text-only.
- `LUMEN_MODEL_ID` (optional) — defaults to `19` (imagen-4)
- `LUMEN_ASPECT_RATIO` (optional) — defaults to `16:9`

## Running locally

```bash
npm install
npm run dev
# http://localhost:3000
```

## Working agreements

- **Act autonomously.** Run commands and make edits without asking for confirmation on routine work. Only pause for destructive or hard-to-reverse actions (force-push, deleting branches, dropping data, sending external messages, etc.).
- **Keep responses short.** Brief status updates only — no trailing summaries of what was just done.
- **Edit existing files** rather than creating new ones when possible.
