# Example: WhatsApp hotel agent

A WhatsApp bot that lets your team operate a Beds24 property from chat. Built by composing two existing projects:

- [`whapi-agent`](https://github.com/AlexHerranr/whapi-agent) — the WhatsApp runtime, buffering, and LLM loop.
- [`beds24-mcp`](https://github.com/AlexHerranr/beds24-mcp) — the Beds24 tools, consumed by the agent through a local MCP client.

The whole thing is ~60 lines of TypeScript. Drop in your credentials, point WHAPI at the webhook, and send a WhatsApp message like *"What reservations do we have tonight?"*.

## Run

```bash
npm install
cp .env.example .env
# fill ANTHROPIC_API_KEY, WHAPI_TOKEN, BEDS24_READ_TOKEN (+ optional BEDS24_WRITE_REFRESH_TOKEN)
npx tsx index.ts
```

Point your WHAPI channel webhook at `http://<host>:3000/webhook`.

## How it works

- `whapi-agent` receives WhatsApp messages, buffers them per chat, and drives the Claude loop.
- A thin MCP client spawned inside the agent connects over stdio to `beds24-mcp` and forwards its tools to Claude as registered tools.
- Claude decides when to call `search_bookings`, `get_booking`, etc. The user sees plain WhatsApp replies.

## Scope

The example is intentionally minimal: no role-based access, no multi-tenant routing, no authorisation beyond the WHAPI channel itself. Extend it for your operation — this is a starting point, not a product.
