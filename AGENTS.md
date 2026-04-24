# AGENTS.md

Guidance for AI coding agents contributing to `beds24-mcp`. Follows the [agents.md](https://agents.md/) convention.

## Project in one paragraph

`beds24-mcp` is a Model Context Protocol server that exposes the Beds24 v2 API as a set of tools any MCP-compatible client (Claude Desktop, Claude Code, Cursor, Continue, and others) can call. It is deliberately small: a thin, well-typed layer over Beds24 with rate limiting, retry, and token refresh. It contains no LLM logic, no UI, no domain opinions.

## Stack

- Node.js ≥ 20, TypeScript strict mode, ESM.
- `@modelcontextprotocol/sdk` for the MCP server.
- `zod` for schema validation (env + tool inputs).
- `p-limit` for client-side concurrency control.
- `express` for the optional HTTP/SSE transport.
- `vitest` for tests.

## Directory map

- `src/index.ts` — entry point. Decides between `stdio` and HTTP/SSE based on argv.
- `src/server.ts` — MCP server setup: tool registration, server lifecycle.
- `src/config.ts` — environment-variable validation.
- `src/beds24/client.ts` — Beds24 v2 HTTP client with retry and rate limit.
- `src/beds24/auth.ts` — refresh-token flow.
- `src/beds24/types.ts` — TypeScript types for Beds24 payloads.
- `src/tools/index.ts` — registry helper and tool listing.
- `src/tools/<name>.ts` — one file per tool, each exporting `{name, description, inputSchema, isDestructive, execute}`.
- `src/utils/` — logger, typed errors, pagination helpers.
- `examples/` — runnable integrations (Claude Desktop config, Cursor config, WhatsApp agent).

## Conventions

- **Language:** English only, everywhere. Code, comments, commits, issues, PRs.
- **No `any`.** Strict TypeScript. Narrow `unknown` at IPC and HTTP boundaries.
- **One tool per file.** If a tool file grows past ~120 lines, either the scope is too wide or the helpers should move to `utils/`.
- **Comments:** only when the *why* is non-obvious.
- **Tool input schemas:** always zod, always with `.describe()` on each field. The LLM relies on those descriptions.
- **Tool outputs:** strip the Beds24 response to the minimum useful for the LLM. Dumping the raw API payload is cheap to write and expensive to run (context tokens).

## Hard rules

- Every write tool MUST be tagged `destructiveHint: true` in the MCP tool definition.
- Write tools MUST NOT be registered if `BEDS24_WRITE_REFRESH_TOKEN` is absent from the environment.
- The HTTP client MUST honour the rate limit: no more than 4 concurrent requests, and a backoff retry on HTTP 429.
- Refresh tokens MUST NEVER appear in logs or error messages. Use the redacting logger in `src/utils/logger.ts`.
- List/search tools MUST require an explicit `limit` (defaulting to 20, max 50). No unbounded listings — they break LLM context.
- Tool outputs MUST use ISO 8601 dates (`YYYY-MM-DD` or full timestamps) and a consistent currency format.

## When adding a new tool

See [`docs/adding-a-tool.md`](docs/adding-a-tool.md).

## Before committing

```bash
npm run typecheck
npm run lint
npm test
```

All three must pass. CI runs the same.

## Non-goals (out of scope)

- No LLM SDK integrations inside the server. MCP clients bring their own LLM.
- No chat interfaces, schedulers, or background jobs. This is a request/response server.
- No business-specific logic (channel-based pricing rules, custom invoicing, OTA-specific handling). Users layer that on top in their own code.
