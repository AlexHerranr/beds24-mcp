# Contributing

Thanks for considering a contribution. Scope is intentionally narrow; open an issue before writing non-trivial code.

## Development setup

```bash
git clone https://github.com/AlexHerranr/beds24-mcp.git
cd beds24-mcp
npm install

cp .env.example .env
# Fill BEDS24_READ_TOKEN (and optionally BEDS24_WRITE_REFRESH_TOKEN)

npm run build
npm start
```

For iteration with hot reload:

```bash
npm run dev
```

## Checks before opening a PR

```bash
npm run typecheck
npm run lint
npm test
```

CI runs the same three.

## Commit style

Short, imperative, English.

```
feat: paginate search_bookings response
fix: handle refresh token expiry mid-request
docs: document BEDS24_API_URL override
```

No emoji. No Spanish.

## Scope rules

Welcome:

- Bug fixes.
- Additional Beds24 tools that cover common daily operations.
- Better rate-limit handling or retry logic.
- Better error mapping from Beds24 responses.
- Packaging improvements.

Usually declined:

- UI / dashboards (this is a protocol server).
- LLM-specific adapters (the server speaks MCP; the client decides how to use it).
- Domain-specific verticals (vacation rentals, hotels, hostels — the server stays generic).
- New transports beyond `stdio` and `HTTP/SSE`.

## Code style

- TypeScript strict mode. No `any`.
- One concern per file. Small files.
- No comments restating the code. Comments only when the *why* is non-obvious.
- Tool inputs always validated by a zod schema with strict field descriptions.
- Tool outputs trim data aggressively — LLM context is expensive.

## License

By contributing, you agree your contributions are licensed under MIT, same as the project.
