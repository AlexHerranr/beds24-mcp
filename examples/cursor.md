# Cursor

Cursor reads MCP configuration from `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` inside a workspace.

```json
{
  "mcpServers": {
    "beds24": {
      "command": "npx",
      "args": ["-y", "@herrandynamics/beds24-mcp"],
      "env": {
        "BEDS24_READ_TOKEN": "your_read_token",
        "BEDS24_WRITE_REFRESH_TOKEN": "your_write_refresh_token"
      }
    }
  }
}
```

Open Cursor's settings → MCP to verify the server appears and its tools are listed.

Continue.dev, Zed, and other MCP-aware editors use the same shape — consult their docs for the exact config-file path.
