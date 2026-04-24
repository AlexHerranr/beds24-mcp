import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Beds24Client } from "../src/beds24/client.js";
import { TokenManager } from "../src/beds24/auth.js";
import { RateLimitError } from "../src/utils/errors.js";
import { createLogger } from "../src/utils/logger.js";

const logger = createLogger("error");

function makeClient(fetchImpl: typeof fetch): Beds24Client {
  const tokens = new TokenManager({
    baseUrl: "https://api.example.com/v2",
    readToken: "read-token",
    logger,
  });
  const client = new Beds24Client({
    baseUrl: "https://api.example.com/v2",
    tokens,
    maxConcurrency: 2,
    logger,
  });
  vi.stubGlobal("fetch", fetchImpl);
  return client;
}

describe("Beds24Client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the read token as header on GET", async () => {
    const calls: RequestInit[] = [];
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      calls.push(init ?? {});
      return new Response(JSON.stringify({ success: true, data: [] }), {
        status: 200,
      });
    }) as unknown as typeof fetch;

    const client = makeClient(fetchImpl);
    await client.request({ path: "/properties", mode: "read" });

    const headers = calls[0]?.headers as Record<string, string>;
    expect(headers.token).toBe("read-token");
  });

  it("retries on HTTP 429 and succeeds", async () => {
    let call = 0;
    const fetchImpl = vi.fn(async () => {
      call += 1;
      if (call === 1) {
        return new Response("", {
          status: 429,
          headers: { "retry-after": "0" },
        });
      }
      return new Response(JSON.stringify({ success: true, data: [] }), {
        status: 200,
      });
    }) as unknown as typeof fetch;

    const client = makeClient(fetchImpl);
    const res = await client.request<{ success: boolean }>({
      path: "/properties",
      mode: "read",
    });
    expect(res.success).toBe(true);
    expect(call).toBe(2);
  });

  it("throws RateLimitError after exhausting retries", async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response("", {
        status: 429,
        headers: { "retry-after": "0" },
      });
    }) as unknown as typeof fetch;

    const client = makeClient(fetchImpl);
    await expect(
      client.request({ path: "/properties", mode: "read" }),
    ).rejects.toBeInstanceOf(RateLimitError);
  });

  it("builds URLs with query parameters", async () => {
    const calls: string[] = [];
    const fetchImpl = vi.fn(async (url: string | URL) => {
      calls.push(String(url));
      return new Response(JSON.stringify({ success: true, data: [] }), {
        status: 200,
      });
    }) as unknown as typeof fetch;

    const client = makeClient(fetchImpl);
    await client.request({
      path: "/bookings",
      query: { propertyId: 123, status: "confirmed" },
      mode: "read",
    });

    expect(calls[0]).toContain("propertyId=123");
    expect(calls[0]).toContain("status=confirmed");
  });
});
