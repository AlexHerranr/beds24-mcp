# Claude Desktop

Add `beds24-mcp` to the MCP servers list in Claude Desktop.

## Config file location

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

## Read-only setup

```json
{
  "mcpServers": {
    "beds24": {
      "command": "npx",
      "args": ["-y", "beds24-mcp"],
      "env": {
        "BEDS24_READ_TOKEN": "your_read_token"
      }
    }
  }
}
```

## With write tools enabled

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

Restart Claude Desktop after editing. In a new conversation the Beds24 tools appear in the tools panel.

## Verify

Ask: *"List my Beds24 properties."* Claude should call `list_properties` and return the result.

If nothing happens, check the MCP logs:

- macOS: `~/Library/Logs/Claude/mcp-server-beds24.log`
- Linux: `~/.config/Claude/logs/mcp-server-beds24.log`
