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

## References

- RedwoodSDK: `https://docs.rwsdk.com/`
- Vercel AI SDK: `https://ai-sdk.dev/`
