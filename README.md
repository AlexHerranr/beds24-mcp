# beds24-mcp

MCP server for [Beds24](https://beds24.com). Ten tools for querying and managing bookings, properties, availability, and pricing from any MCP-compatible client.

[![MIT](https://img.shields.io/badge/license-MIT-yellow)](LICENSE)
[![TypeScript](https://img.shields.io/badge/typescript-strict-blue)](tsconfig.json)
[![Node 20+](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](.nvmrc)

## Install

```bash
npx -y beds24-mcp
```

Published on npm. No global install required.

## Beds24 tokens

Beds24 does not offer OAuth. Tokens are generated manually from the Beds24 dashboard:

1. Log in at [beds24.com](https://beds24.com) with the account that owns the properties.
2. **Settings → Apps → API v2 → Generate token**.
3. For `BEDS24_READ_TOKEN` use **READ** scope. Required.
4. For `BEDS24_WRITE_REFRESH_TOKEN` use **WRITE** scope with a refresh token. Optional; enables the write tools.

Tokens are read from the environment and never written to disk by this server.

## Configuration

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or platform equivalent:

```json
{
  "mcpServers": {
    "beds24": {
      "command": "npx",
      "args": ["-y", "beds24-mcp"],
      "env": {
        "BEDS24_READ_TOKEN": "your_read_token",
        "BEDS24_WRITE_REFRESH_TOKEN": "your_write_refresh_token"
      }
    }
  }
}
```

Other clients follow the same shape. See [`examples/claude-code.md`](examples/claude-code.md) and [`examples/cursor.md`](examples/cursor.md).

| Variable | Required | Description |
|---|---|---|
| `BEDS24_READ_TOKEN` | yes | READ-scope token. |
| `BEDS24_WRITE_REFRESH_TOKEN` | no | WRITE-scope refresh token. Absent → write tools are not registered. |
| `BEDS24_API_URL` | no | Default `https://api.beds24.com/v2`. |
| `BEDS24_MAX_CONCURRENCY` | no | Default 4. |
| `LOG_LEVEL` | no | `trace` \| `debug` \| `info` \| `warn` \| `error`. |
| `HTTP_PORT` | no | Only with `--http`. Default 3000. |

## Tools

| Tool | Mode | Description |
|---|---|---|
| `list_properties` | read | List accessible properties (paginated). |
| `list_rooms` | read | List rooms for a property. |
| `check_availability` | read | Per-day availability for a room and date range. |
| `search_bookings` | read | Search bookings by property, room, status, dates, or guest name. |
| `get_booking` | read | Full detail of a booking. |
| `get_prices` | read | Per-day pricing and stay restrictions. |
| `create_booking` | write | Create a manual booking. |
| `cancel_booking` | write | Cancel a booking. |
| `set_prices` | write | Set a fixed price over a date range. |
| `send_guest_message` | write | Send a message to a guest. |

## Safety

Write tools are off by default. If `BEDS24_WRITE_REFRESH_TOKEN` is not set, they are never registered. When they are registered, each one is tagged `destructiveHint: true`; compliant MCP clients (Claude Desktop, Claude Code, Cursor) surface an explicit confirmation prompt before execution.

The server uses a redacting logger: tokens never appear in logs or error responses. Refresh tokens live only in memory.

The server mutates only through the Beds24 API. It does not write to disk, keeps no local state, and makes no outbound requests other than to `BEDS24_API_URL`.

## Usage

Once the MCP is registered, talk to the client naturally:

- "Show the bookings arriving this weekend."
- "What is the price of room 384210 between March 12 and 14?"
- "Block room 384210 at 120 USD per night from December 20 to 30."
- "Reply to the guest in booking 90125 with our check-in instructions."

The client picks the matching tool. Write operations trigger a confirmation prompt.

## Transports

- **`stdio`** (default) — used by Claude Desktop, Claude Code, Cursor, and every MCP client that spawns the server as a subprocess.
- **HTTP/SSE** — opt-in for remote deployments. Run `npx -y beds24-mcp --http` and the server listens on `HTTP_PORT` with `/sse` for the event stream and `/messages` for tool calls.

## Debugging

Run the server in isolation with the official MCP Inspector:

```bash
BEDS24_READ_TOKEN=your_token npx @modelcontextprotocol/inspector npx -y beds24-mcp
```

The inspector lists the tools, lets you call each one interactively, and shows the raw JSON payloads.

## Troubleshooting

- **Startup fails with `Invalid configuration`.** `BEDS24_READ_TOKEN` is missing or empty.
- **Tool returns `AuthError: 401`.** The read token is wrong, expired, or revoked. Regenerate and restart the client.
- **Write tools are absent from the tool list.** `BEDS24_WRITE_REFRESH_TOKEN` is not set in the client's `env`.
- **`AuthError: Refresh token request failed`.** The write refresh token is invalid. Generate a new one in the Beds24 dashboard.
- **`RateLimitError` after retries.** Sustained load exceeded Beds24's rate limit. Lower `BEDS24_MAX_CONCURRENCY` or wait.
- **`ZodError` mentioning date format.** Dates must be `YYYY-MM-DD`. The schema rejects everything else on purpose.

## Limits

- Beds24 rate limits apply. Client-side concurrency default 4, exponential-backoff retry on HTTP 429.
- No OAuth — tokens are static dashboard strings.
- `list_*` and `search_*` cap at 50 items per call. Use `offset` for deeper pages.
- Currencies are not normalised; `price` uses the property's configured currency.

## Examples

The [`examples/`](examples) folder contains ready-to-copy configurations for Claude Desktop, Claude Code, and Cursor, plus a runnable [`whatsapp-hotel-agent`](examples/whatsapp-hotel-agent) that composes this server with [`whapi-agent`](https://github.com/AlexHerranr/whapi-agent) to operate a property from WhatsApp.

## Contributing

Read [`AGENTS.md`](AGENTS.md) and [`CONTRIBUTING.md`](CONTRIBUTING.md). Scope is intentionally narrow.

## License

[MIT](LICENSE). Maintained by [Alexander H.](https://github.com/AlexHerranr) at Herran Dynamics S.A.S.

This project is not affiliated with or endorsed by Beds24.com Limited. Beds24 is a trademark of its respective owner.
