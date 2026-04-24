import { describe, expect, it } from "vitest";
import {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  paginate,
  resolveLimit,
  resolveOffset,
} from "../src/utils/pagination.js";

describe("pagination", () => {
  it("defaults limit to 20 and offset to 0", () => {
    expect(resolveLimit(undefined)).toBe(DEFAULT_LIMIT);
    expect(resolveOffset(undefined)).toBe(0);
  });

  it("caps limit at MAX_LIMIT", () => {
    expect(resolveLimit(999)).toBe(MAX_LIMIT);
  });

  it("paginates a slice of the array", () => {
    const all = Array.from({ length: 30 }, (_, i) => i);
    const result = paginate(all, { limit: 10, offset: 20 });
    expect(result.items).toEqual([20, 21, 22, 23, 24, 25, 26, 27, 28, 29]);
    expect(result.total).toBe(30);
    expect(result.hasMore).toBe(false);
  });

  it("reports hasMore when more items remain", () => {
    const all = Array.from({ length: 100 }, (_, i) => i);
    const result = paginate(all, { limit: 20, offset: 0 });
    expect(result.items).toHaveLength(20);
    expect(result.hasMore).toBe(true);
    expect(result.offset).toBe(0);
  });

  it("enforces the cap even when no limit is given", () => {
    const all = Array.from({ length: 100 }, (_, i) => i);
    const result = paginate(all, {});
    expect(result.limit).toBe(DEFAULT_LIMIT);
    expect(result.items).toHaveLength(DEFAULT_LIMIT);
  });
});
