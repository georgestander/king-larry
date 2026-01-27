# Repository Guidelines

## Project Structure & Module Organization

- `src/worker.tsx`: Cloudflare Worker entrypoint. Defines request middleware and routes via `defineApp([...])`, `render()`, and `route()`.
- `src/app/`: React Server Components (RSC) UI.
  - `src/app/document.tsx`: HTML shell + hydration hook (`import("/src/client.tsx")`).
  - `src/app/pages/`: route components (e.g., `src/app/pages/home.tsx`).
  - `src/app/headers.ts`: shared security headers (uses `rw.nonce` for CSP).
  - `src/app/shared/links.ts`: typed link helper (`linkFor<App>()`).
- `src/client.tsx`: client runtime bootstrap (`initClient()` for RSC hydration).
- `public/`: static assets.
- `types/`: local TypeScript declarations (e.g., `types/rw.d.ts`, `worker-configuration.d.ts`).
- `vite.config.mts` / `wrangler.jsonc`: Vite + Workers config and deploy settings.

## Build, Test, and Development Commands

Use `pnpm` (repo ships `pnpm-lock.yaml`).

- `pnpm dev`: start the Vite dev server in a Workers-like runtime.
- `pnpm dev:init`: run RedwoodSDK dev bootstrap (runs `generate`, migrations/seed if those scripts exist).
- `pnpm generate`: set up `.env`/`.dev.vars` and run `wrangler types` to update `worker-configuration.d.ts`.
- `pnpm check`: run `generate` + TypeScript typecheck (`tsc`).
- `pnpm build` / `pnpm preview`: production build and local preview.
- `pnpm worker:run ./src/scripts/foo.ts`: execute a script inside the worker sandbox.
- `pnpm release`: build + deploy via Wrangler (prompts and may rename the worker from `wrangler.jsonc`).

## Coding Style & Naming Conventions

- TypeScript + React (RSC). Server components are default; add `"use client"` for interactive components and `"use server"` for server functions/actions.
- Match existing style: 2-space indentation, double quotes, trailing commas, ESM modules.
- Routing patterns: dynamic params use `:id`; wildcards use `*` (captured as `params.$0`).

## Testing Guidelines

- No dedicated test runner is configured yet. Treat `pnpm check` as the minimum gate.
- For UI changes, also validate manually with `pnpm dev` and a browser.

## Commit & Pull Request Guidelines

- This repo has no git history yet—use Conventional Commits going forward (e.g., `feat: add /api/ping`, `fix: header nonce`).
- PRs should include: a short description, how to verify, commands run (`pnpm check`), and screenshots for UI changes.
- Configuration: call out changes to `wrangler.jsonc`/env vars; never commit secrets (use `.env`/Wrangler secrets).
