# Claude Code

Add `beds24-mcp` to Claude Code's MCP servers from the CLI:

```bash
claude mcp add beds24 \
  --env BEDS24_READ_TOKEN=your_read_token \
  -- npx -y @herrandynamics/beds24-mcp
```

For write tools:

```bash
claude mcp add beds24 \
  --env BEDS24_READ_TOKEN=your_read_token \
  --env BEDS24_WRITE_REFRESH_TOKEN=your_write_refresh_token \
  -- npx -y @herrandynamics/beds24-mcp
```

List registered servers:

```bash
claude mcp list
```

Remove:

```bash
claude mcp remove beds24
```

Config is written to `.claude/mcp.json` in the project root (or `~/.claude/mcp.json` when scoped globally with `--scope user`).
