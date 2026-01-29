# Narrative Interviewer

LLM-powered interview and survey platform for narrative, time-boxed research sessions. Built on RedwoodSDK + Cloudflare Workers with Vercel AI SDK, shadcn/ui, Tailwind, and Lucide.

## Getting Started

```shell
pnpm install
cp .env.example .env
pnpm generate
pnpm dev
```

Open `http://localhost:5173/` to access the dashboard.

## AI Providers

Set one or more provider keys in `.env`:

- `AI_PROVIDER`: `openai` | `anthropic` | `openrouter` (defaults to Anthropic)
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`
- Optional model overrides: `OPENAI_MODEL`, `ANTHROPIC_MODEL`, `OPENROUTER_MODEL`

## Core Flows

- **Scripts**: Generate or author interview JSON, save versions, and rollback.
- **Sessions**: Create a session, invite participants, track completion.
- **Interviews**: Participants follow the invite link for a narrative chat.
- **Exports**: Download session transcripts as CSV or PDF.

## Commands

- `pnpm dev`: local dev server
- `pnpm dev:init`: RedwoodSDK dev bootstrap
- `pnpm test`: unit tests
- `pnpm check`: generate types + TypeScript check
- `pnpm build`: production build

## Deploy (Cloudflare)

This app deploys as a Cloudflare Worker named `king-larry` (see `wrangler.jsonc`).

1. Login / verify your Cloudflare account:

```shell
pnpm wrangler whoami
```

2. Set at least one AI provider key (recommended: OpenAI):

```shell
pnpm wrangler secret put OPENAI_API_KEY
```

Optional (only if you use them):

```shell
pnpm wrangler secret put ANTHROPIC_API_KEY
pnpm wrangler secret put OPENROUTER_API_KEY
```

Optional model defaults:

```shell
pnpm wrangler secret put OPENAI_MODEL
pnpm wrangler secret put ANTHROPIC_MODEL
pnpm wrangler secret put OPENROUTER_MODEL
```

3. Deploy:

```shell
pnpm release
```

4. Tail logs (server logs + errors):

```shell
pnpm wrangler tail
```

Notes:
- `.dev.vars` is used for local development (in this repo it’s a symlink to `.env`). Don’t commit secrets.
- Invite links only work for teammates when you’re using a deployed URL (not `localhost`).

## References

- RedwoodSDK: `https://docs.rwsdk.com/`
- Vercel AI SDK: `https://ai-sdk.dev/`
