# CLAUDE.md

Pointer for AI agents working on this codebase.

Primary guidance lives in [`AGENTS.md`](AGENTS.md) — read it first.

## Quick reference

- **Language:** English only.
- **Stack:** TypeScript ESM, Node ≥ 20, `@modelcontextprotocol/sdk`, `zod`, `p-limit`.
- **Build:** `npm run build` — emits to `dist/`.
- **Dev:** `npm run dev` — watch mode with `tsx`.
- **Check:** `npm run typecheck && npm run lint && npm test` before any commit.

## Hard rules (mirror of AGENTS.md)

- No `any`. Strict TypeScript.
- Every write tool tagged `destructiveHint: true`.
- Write tools auto-disabled without `BEDS24_WRITE_REFRESH_TOKEN`.
- Tool outputs stripped to LLM-friendly minimum.
- ISO 8601 dates, consistent currency format.
- No secrets in logs.
