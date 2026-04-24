import pLimit from "p-limit";
import { ApiError, AuthError, RateLimitError } from "../utils/errors.js";
import type { Logger } from "../utils/logger.js";
import type { TokenManager } from "./auth.js";

export interface Beds24ClientOptions {
  baseUrl: string;
  tokens: TokenManager;
  maxConcurrency: number;
  logger: Logger;
}

export type Mode = "read" | "write";

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  mode: Mode;
}

const MAX_RETRIES = 4;
const BASE_BACKOFF_MS = 400;

export class Beds24Client {
  private readonly limiter: ReturnType<typeof pLimit>;

  constructor(private readonly opts: Beds24ClientOptions) {
    this.limiter = pLimit(opts.maxConcurrency);
  }

  async request<T>(options: RequestOptions): Promise<T> {
    return this.limiter(() => this.send<T>(options));
  }

  private async send<T>(options: RequestOptions): Promise<T> {
    const url = this.buildUrl(options.path, options.query);
    let attempt = 0;
    let lastError: unknown;

    while (attempt <= MAX_RETRIES) {
      const token = await this.tokenFor(options.mode);
      const res = await fetch(url, {
        method: options.method ?? "GET",
        headers: {
          token,
          "Content-Type": "application/json",
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });

      if (res.status === 429) {
        const retryAfter = parseRetryAfter(res.headers.get("retry-after"));
        const wait = retryAfter ?? backoffMs(attempt);
        this.opts.logger.warn("rate limited, backing off", {
          attempt,
          waitMs: wait,
          path: options.path,
        });
        if (attempt >= MAX_RETRIES) {
          throw new RateLimitError("Beds24 rate limit exceeded", wait);
        }
        await sleep(wait);
        attempt += 1;
        continue;
      }

      if (res.status >= 500 && res.status < 600) {
        this.opts.logger.warn("beds24 5xx, retrying", {
          attempt,
          status: res.status,
          path: options.path,
        });
        if (attempt >= MAX_RETRIES) {
          throw new ApiError(`Beds24 ${res.status}`, res.status);
        }
        await sleep(backoffMs(attempt));
        attempt += 1;
        continue;
      }

      if (!res.ok) {
        let details: unknown = undefined;
        try {
          details = await res.json();
        } catch {
          details = await res.text().catch(() => undefined);
        }
        if (res.status === 401 || res.status === 403) {
          throw new AuthError(`Beds24 auth failed: ${res.status}`, res.status, details);
        }
        throw new ApiError(`Beds24 request failed: ${res.status}`, res.status, details);
      }

      try {
        return (await res.json()) as T;
      } catch (err) {
        lastError = err;
        throw new ApiError("Beds24 returned non-JSON body", res.status, String(err));
      }
    }

    throw new ApiError(
      `Beds24 request failed after ${MAX_RETRIES} retries`,
      0,
      lastError,
    );
  }

  private async tokenFor(mode: Mode): Promise<string> {
    if (mode === "read") {
      const token = this.opts.tokens.readToken();
      if (!token) throw new AuthError("No BEDS24_READ_TOKEN configured");
      return token;
    }
    return this.opts.tokens.writeToken();
  }

  private buildUrl(path: string, query?: RequestOptions["query"]): string {
    const url = new URL(path.startsWith("/") ? path.slice(1) : path, this.opts.baseUrl + "/");
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined) continue;
        url.searchParams.append(key, String(value));
      }
    }
    return url.toString();
  }
}

function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;
  const seconds = Number(header);
  if (!Number.isNaN(seconds)) return seconds * 1000;
  const dateMs = Date.parse(header);
  if (!Number.isNaN(dateMs)) return Math.max(0, dateMs - Date.now());
  return null;
}

function backoffMs(attempt: number): number {
  const jitter = Math.floor(Math.random() * 150);
  return BASE_BACKOFF_MS * 2 ** attempt + jitter;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
