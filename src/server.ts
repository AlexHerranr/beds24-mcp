import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";
import { zodToJsonSchema as zodToJson } from "zod-to-json-schema";
import { Beds24Client } from "./beds24/client.js";
import { TokenManager } from "./beds24/auth.js";
import type { Config } from "./config.js";
import { buildToolList } from "./tools/index.js";
import type { ToolContext, ToolDefinition } from "./tools/index.js";
import { Beds24Error } from "./utils/errors.js";
import type { Logger } from "./utils/logger.js";

export interface CreateServerOptions {
  config: Config;
  logger: Logger;
}

export function createMcpServer(opts: CreateServerOptions): Server {
  const { config, logger } = opts;

  const tokens = new TokenManager({
    baseUrl: config.BEDS24_API_URL,
    readToken: config.BEDS24_READ_TOKEN,
    writeRefreshToken: config.BEDS24_WRITE_REFRESH_TOKEN,
    logger,
  });

  const client = new Beds24Client({
    baseUrl: config.BEDS24_API_URL,
    tokens,
    maxConcurrency: config.BEDS24_MAX_CONCURRENCY,
    logger,
  });

  const ctx: ToolContext = {
    client,
    hasWriteCapability: tokens.hasWriteCapability(),
  };

  const tools = buildToolList(ctx);
  const toolsByName = new Map<string, ToolDefinition>();
  for (const tool of tools) toolsByName.set(tool.name, tool);

  logger.info("mcp server initialised", {
    tools: tools.map((t) => t.name),
    writeEnabled: ctx.hasWriteCapability,
  });

  const server = new Server(
    {
      name: "beds24-mcp",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((t) => ({
      name: t.name,
      title: t.title,
      description: t.description,
      inputSchema: zodToJsonSchema(t.inputSchema),
      annotations: {
        readOnlyHint: t.readOnlyHint ?? false,
        destructiveHint: t.destructiveHint ?? false,
      },
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const tool = toolsByName.get(req.params.name);
    if (!tool) {
      return errorResult(`Unknown tool: ${req.params.name}`);
    }

    const parsed = tool.inputSchema.safeParse(req.params.arguments ?? {});
    if (!parsed.success) {
      return errorResult(
        `Invalid arguments for ${tool.name}: ${parsed.error.message}`,
      );
    }

    try {
      const output = await tool.execute(parsed.data, ctx);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(output, null, 2) },
        ],
      };
    } catch (err) {
      logger.error("tool execution failed", {
        tool: tool.name,
        error: err instanceof Error ? err.message : String(err),
      });
      const message =
        err instanceof Beds24Error
          ? `${err.name}: ${err.message}`
          : err instanceof Error
            ? err.message
            : String(err);
      return errorResult(message);
    }
  });

  return server;
}

function errorResult(message: string): {
  isError: true;
  content: { type: "text"; text: string }[];
} {
  return {
    isError: true,
    content: [{ type: "text" as const, text: message }],
  };
}

function zodToJsonSchema(schema: z.ZodType<unknown>): Record<string, unknown> {
  const json = zodToJson(schema, {
    target: "openApi3",
    $refStrategy: "none",
  }) as Record<string, unknown>;
  if (json["type"] !== "object") {
    return { type: "object", properties: {} };
  }
  return json;
}
