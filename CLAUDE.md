# Storista

A free, no-login web app that generates short illustrated-style 4-page bedtime stories for kids. The customer types an idea (e.g. "a shy fox who finds a glowing stone") and picks an age range; the server calls OpenRouter to write the story.

## Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS v4
- OpenRouter for the LLM — story uses a 3-model `:free` fallback chain (small/fast Nemotron and Gemma variants); set `OPENROUTER_MODEL` to override with a paid model for higher quality
- Pollinations.ai for per-page illustrations by default (free public API, no auth, no quota). OpenRouter Nano Banana and Lumen Pro are available via `IMAGE_PROVIDER`.
- No database, no auth — public service

## Structure

- `src/app/page.tsx` — single-page UI (idea form + 4-page story viewer)
- `src/app/api/generate/route.ts` — POST endpoint: calls OpenRouter for the story, then per-page images via the configured `IMAGE_PROVIDER`. Returns `{ title, pages: [{ pageNumber, text, imageUrl }] }`
- `src/lib/pollinations-image.ts` — Pollinations.ai URL builder (default image provider, free)
- `src/lib/openrouter-image.ts` — OpenRouter image generation (paid)
- `src/lib/lumen.ts` — Lumen Pro MCP-over-HTTP client (paid)
- `src/app/globals.css` — dark theme + gradient utilities
- `src/app/layout.tsx` — root layout & metadata

## Environment

Copy `.env.local.example` → `.env.local` and fill in:

- `OPENROUTER_API_KEY` (required) — get one at https://openrouter.ai/keys
- `OPENROUTER_MODEL` (optional) — defaults to a `:free` fallback chain. Set to a paid model (e.g. `google/gemini-2.5-flash`) for higher quality.
- `OPENROUTER_IMAGE_MODEL` (optional) — defaults to `google/gemini-2.5-flash-image`
- `OPENROUTER_SITE_URL`, `OPENROUTER_SITE_NAME` (optional, used by OpenRouter for attribution)
- `IMAGE_PROVIDER` (optional) — `pollinations` (default, free), `openrouter` (paid), `lumen`, or `none`
- `POLLINATIONS_MODEL` (optional) — defaults to `flux`
- `LUMEN_TOKEN` (only if `IMAGE_PROVIDER=lumen`) — bearer token from https://app.lumenpro.io
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
