import { z } from "zod";
import { ConfigError } from "./utils/errors.js";

const configSchema = z.object({
  BEDS24_READ_TOKEN: z.string().min(1, "BEDS24_READ_TOKEN is required"),
  BEDS24_WRITE_REFRESH_TOKEN: z.string().optional(),
  BEDS24_API_URL: z.string().url().default("https://api.beds24.com/v2"),
  BEDS24_MAX_CONCURRENCY: z.coerce.number().int().positive().max(16).default(4),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error"])
    .default("info"),
  HTTP_PORT: z.coerce.number().int().positive().default(3000),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = configSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new ConfigError(`Invalid configuration:\n${issues}`);
  }
  return parsed.data;
}
