import { z } from "zod";
import type { Beds24Envelope, Beds24Room } from "../beds24/types.js";
import { paginate, paginationSchema } from "../utils/pagination.js";
import type { ToolDefinition } from "./index.js";

const inputSchema = paginationSchema.extend({
  propertyId: z
    .number()
    .int()
    .positive()
    .describe("Beds24 property id returned by list_properties."),
});
type Input = z.infer<typeof inputSchema>;

export const listRooms: ToolDefinition<Input> = {
  name: "list_rooms",
  title: "List rooms",
  description:
    "List rooms (unit types) for a given property. Returns id, name, quantity of units, and max occupancy.",
  inputSchema,
  readOnlyHint: true,
  execute: async (input, ctx) => {
    const res = await ctx.client.request<Beds24Envelope<Beds24Room[]>>({
      path: "/properties/rooms",
      query: { propertyId: input.propertyId },
      mode: "read",
    });
    const all = (res.data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      qty: r.qty ?? null,
      maxPeople: r.maxPeople ?? null,
    }));
    return paginate(all, input);
  },
};
