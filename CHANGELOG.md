# Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] — 2026-04-24

Initial release.

### Added

- MCP server exposing ten tools over the Beds24 v2 API: `list_properties`, `list_rooms`, `check_availability`, `search_bookings`, `get_booking`, `get_prices`, `create_booking`, `cancel_booking`, `set_prices`, `send_guest_message`.
- Transports: `stdio` (default, for Claude Desktop, Claude Code, Cursor) and `HTTP/SSE` (optional, for remote deployments).
- Write tools auto-disabled when `BEDS24_WRITE_REFRESH_TOKEN` is not set.
- All write tools tagged `destructiveHint: true` so MCP clients can prompt for confirmation.
- Refresh-token flow with renewal before expiry.
- Client-side rate limiting via `p-limit` and exponential-backoff retry on HTTP 429.
- Mandatory pagination on list/search tools (configurable `limit`, max 50).
- Environment-variable validation with zod at startup.
- Runnable example combining `whapi-agent` + this MCP (WhatsApp hotel operator).
