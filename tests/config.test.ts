import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";
import { ConfigError } from "../src/utils/errors.js";

describe("loadConfig", () => {
  it("accepts the minimum valid env", () => {
    const config = loadConfig({ BEDS24_READ_TOKEN: "abc" } as NodeJS.ProcessEnv);
    expect(config.BEDS24_READ_TOKEN).toBe("abc");
    expect(config.BEDS24_API_URL).toBe("https://api.beds24.com/v2");
    expect(config.BEDS24_MAX_CONCURRENCY).toBe(4);
    expect(config.LOG_LEVEL).toBe("info");
  });

  it("rejects missing read token", () => {
    expect(() => loadConfig({} as NodeJS.ProcessEnv)).toThrow(ConfigError);
  });

  it("respects overrides", () => {
    const config = loadConfig({
      BEDS24_READ_TOKEN: "x",
      BEDS24_API_URL: "https://api.example.com/v2",
      BEDS24_MAX_CONCURRENCY: "2",
      LOG_LEVEL: "debug",
    } as NodeJS.ProcessEnv);
    expect(config.BEDS24_API_URL).toBe("https://api.example.com/v2");
    expect(config.BEDS24_MAX_CONCURRENCY).toBe(2);
    expect(config.LOG_LEVEL).toBe("debug");
  });

  it("exposes write capability when refresh token is set", () => {
    const config = loadConfig({
      BEDS24_READ_TOKEN: "r",
      BEDS24_WRITE_REFRESH_TOKEN: "w",
    } as NodeJS.ProcessEnv);
    expect(config.BEDS24_WRITE_REFRESH_TOKEN).toBe("w");
  });
});
