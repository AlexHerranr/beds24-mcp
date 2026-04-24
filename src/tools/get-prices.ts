import { z } from "zod";
import type {
  Beds24CalendarEntry,
  Beds24Envelope,
} from "../beds24/types.js";
import type { ToolDefinition } from "./index.js";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be ISO 8601: YYYY-MM-DD");

const inputSchema = z.object({
  roomId: z.number().int().positive().describe("Beds24 room id."),
  startDate: isoDate.describe("Start date (inclusive), YYYY-MM-DD."),
  endDate: isoDate.describe("End date (inclusive), YYYY-MM-DD."),
});
type Input = z.infer<typeof inputSchema>;

export const getPrices: ToolDefinition<Input> = {
  name: "get_prices",
  title: "Get prices",
  description:
    "Return per-day pricing and restrictions (price1, minStay, maxStay) for a room in a date range.",
  inputSchema,
  readOnlyHint: true,
  execute: async (input, ctx) => {
    const res = await ctx.client.request<
      Beds24Envelope<Beds24CalendarEntry[]>
    >({
      path: "/inventory/rooms/calendar",
      query: {
        roomId: input.roomId,
        startDate: input.startDate,
        endDate: input.endDate,
      },
      mode: "read",
    });
    const days = (res.data ?? []).map((d) => ({
      date: d.date,
      price: d.price1 ?? null,
      minStay: d.minStay ?? null,
      maxStay: d.maxStay ?? null,
    }));
    return {
      roomId: input.roomId,
      startDate: input.startDate,
      endDate: input.endDate,
      days,
    };
  },
};
