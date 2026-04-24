import "dotenv/config";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { createAgent, loadConfig } from "whapi-agent";
import { z } from "zod";

const config = loadConfig();

// Spawn beds24-mcp over stdio and surface its tools to the LLM via whapi-agent.
const transport = new StdioClientTransport({
  command: "npx",
  args: ["-y", "beds24-mcp"],
  env: {
    BEDS24_READ_TOKEN: process.env["BEDS24_READ_TOKEN"]!,
    ...(process.env["BEDS24_WRITE_REFRESH_TOKEN"]
      ? { BEDS24_WRITE_REFRESH_TOKEN: process.env["BEDS24_WRITE_REFRESH_TOKEN"] }
      : {}),
  },
});

const mcp = new Client({ name: "whatsapp-hotel-agent", version: "0.0.0" }, {});
await mcp.connect(transport);

const agent = createAgent({
  anthropicApiKey: config.ANTHROPIC_API_KEY,
  model: config.CLAUDE_MODEL,
  whapiToken: config.WHAPI_TOKEN,
  whapiApiUrl: config.WHAPI_API_URL,
  bufferWindowMs: config.BUFFER_WINDOW_MS,
  sqlitePath: "./data/hotel-agent.sqlite",
  systemPrompt: [
    "You are a hotel reception assistant replying over WhatsApp.",
    "Use the beds24 tools to answer questions about bookings, availability, and pricing.",
    "Always confirm with the user before calling destructive tools (create, cancel, modify).",
    "Reply in the user's language. Keep answers short.",
  ].join(" "),
});

const { tools } = await mcp.listTools();

for (const mcpTool of tools) {
  agent.registerTool({
    name: mcpTool.name,
    description: mcpTool.description ?? "",
    schema: z.record(z.unknown()),
    execute: async (input: unknown) => {
      const result = await mcp.callTool({
        name: mcpTool.name,
        arguments: (input ?? {}) as Record<string, unknown>,
      });
      return result.content;
    },
  });
}

const server = agent.listen(Number(process.env["PORT"] ?? 3000));

const shutdown = async (signal: string): Promise<void> => {
  console.error(`shutdown: ${signal}`);
  server.close();
  await mcp.close();
  await agent.close();
  process.exit(0);
};
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
