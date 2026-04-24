type Level = "trace" | "debug" | "info" | "warn" | "error";
const order: Record<Level, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
};

const SECRET_KEYS = new Set([
  "token",
  "refreshtoken",
  "refresh_token",
  "beds24_read_token",
  "beds24_write_refresh_token",
  "authorization",
]);

function redact(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(redact);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SECRET_KEYS.has(k.toLowerCase())
        ? "[REDACTED]"
        : redact(v);
    }
    return out;
  }
  return value;
}

export class Logger {
  constructor(private readonly level: Level = "info") {}

  private log(level: Level, message: string, fields?: Record<string, unknown>): void {
    if (order[level] < order[this.level]) return;
    const entry = {
      t: new Date().toISOString(),
      level,
      msg: message,
      ...(fields ? (redact(fields) as Record<string, unknown>) : {}),
    };
    const stream = level === "error" || level === "warn" ? process.stderr : process.stderr;
    stream.write(JSON.stringify(entry) + "\n");
  }

  trace(msg: string, fields?: Record<string, unknown>): void { this.log("trace", msg, fields); }
  debug(msg: string, fields?: Record<string, unknown>): void { this.log("debug", msg, fields); }
  info(msg: string, fields?: Record<string, unknown>): void { this.log("info", msg, fields); }
  warn(msg: string, fields?: Record<string, unknown>): void { this.log("warn", msg, fields); }
  error(msg: string, fields?: Record<string, unknown>): void { this.log("error", msg, fields); }
}

export function createLogger(level: Level = "info"): Logger {
  return new Logger(level);
}
