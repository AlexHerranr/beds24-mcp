#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import { loadConfig } from "./config.js";
import { createMcpServer } from "./server.js";
import { createLogger } from "./utils/logger.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const useHttp = args.includes("--http");

  const config = loadConfig();
  const logger = createLogger(config.LOG_LEVEL);

  const server = createMcpServer({ config, logger });

  if (useHttp) {
    await startHttp(server, config.HTTP_PORT, logger);
  } else {
    await startStdio(server, logger);
  }
}

async function startStdio(
  server: ReturnType<typeof createMcpServer>,
  logger: ReturnType<typeof createLogger>,
): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("stdio transport connected");

  const shutdown = async (signal: string): Promise<void> => {
    logger.info("shutting down", { signal });
    await server.close().catch(() => {});
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

async function startHttp(
  server: ReturnType<typeof createMcpServer>,
  port: number,
  logger: ReturnType<typeof createLogger>,
): Promise<void> {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  // Map keyed by SSE sessionId so multiple concurrent clients can connect.
  const transports = new Map<string, SSEServerTransport>();

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.get("/sse", async (_req, res) => {
    const transport = new SSEServerTransport("/messages", res);
    transports.set(transport.sessionId, transport);
    res.on("close", () => {
      transports.delete(transport.sessionId);
      logger.debug("sse client disconnected", { sessionId: transport.sessionId });
    });
    await server.connect(transport);
    logger.info("sse client connected", { sessionId: transport.sessionId });
  });

  app.post("/messages", async (req, res) => {
    const sessionId = String(req.query["sessionId"] ?? "");
    const transport = transports.get(sessionId);
    if (!transport) {
      res.status(400).json({ error: "no active SSE session for given sessionId" });
      return;
    }
    await transport.handlePostMessage(req, res, req.body);
  });

  app.listen(port, () => {
    logger.info("http transport listening", { port });
  });
}

main().catch((err) => {
  const logger = createLogger("error");
  logger.error("fatal startup error", {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
