import { z } from "zod";

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 50;

export const paginationSchema = z.object({
  limit: z
    .number()
    .int()
    .positive()
    .max(MAX_LIMIT)
    .optional()
    .describe(
      `Maximum items to return. Default ${DEFAULT_LIMIT}, hard cap ${MAX_LIMIT}.`,
    ),
  offset: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe("Number of items to skip from the start of the matching set."),
});

export type Pagination = z.infer<typeof paginationSchema>;

export interface Paginated<T> {
  items: T[];
  total?: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export function resolveLimit(limit?: number): number {
  if (limit === undefined) return DEFAULT_LIMIT;
  return Math.min(limit, MAX_LIMIT);
}

export function resolveOffset(offset?: number): number {
  return offset ?? 0;
}

export function paginate<T>(
  all: T[],
  pagination: Pagination,
): Paginated<T> {
  const limit = resolveLimit(pagination.limit);
  const offset = resolveOffset(pagination.offset);
  const items = all.slice(offset, offset + limit);
  return {
    items,
    total: all.length,
    limit,
    offset,
    hasMore: offset + items.length < all.length,
  };
}
