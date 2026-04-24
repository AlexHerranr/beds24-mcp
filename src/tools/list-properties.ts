import { z } from "zod";
import type { Beds24Envelope, Beds24Property } from "../beds24/types.js";
import { paginate, paginationSchema } from "../utils/pagination.js";
import type { ToolDefinition } from "./index.js";

const inputSchema = paginationSchema;
type Input = z.infer<typeof inputSchema>;

export const listProperties: ToolDefinition<Input> = {
  name: "list_properties",
  title: "List properties",
  description:
    "List all Beds24 properties the authenticated user can access. Returns a paginated list with id, name, currency, city, country, and time zone.",
  inputSchema,
  readOnlyHint: true,
  execute: async (input, ctx) => {
    const res = await ctx.client.request<Beds24Envelope<Beds24Property[]>>({
      path: "/properties",
      mode: "read",
    });
    const all = (res.data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      currency: p.currency ?? null,
      city: p.city ?? null,
      country: p.country ?? null,
      timeZone: p.timeZone ?? null,
    }));
    return paginate(all, input);
  },
};
