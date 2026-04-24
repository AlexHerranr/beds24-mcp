import { z } from "zod";
import type {
  Beds24AvailabilityEntry,
  Beds24Envelope,
} from "../beds24/types.js";
import type { ToolDefinition } from "./index.js";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be ISO 8601: YYYY-MM-DD");

const inputSchema = z.object({
  roomId: z.number().int().positive().describe("Beds24 room id."),
  startDate: isoDate.describe("Start of range (inclusive), YYYY-MM-DD."),
  endDate: isoDate.describe("End of range (inclusive), YYYY-MM-DD."),
});
type Input = z.infer<typeof inputSchema>;

export const checkAvailability: ToolDefinition<Input> = {
  name: "check_availability",
  title: "Check availability",
  description:
    "Return per-day availability (number of units free) for a room between two dates.",
  inputSchema,
  readOnlyHint: true,
  execute: async (input, ctx) => {
    const res = await ctx.client.request<
      Beds24Envelope<Beds24AvailabilityEntry[]>
    >({
      path: "/inventory/rooms/availability",
      query: {
        roomId: input.roomId,
        startDate: input.startDate,
        endDate: input.endDate,
      },
      mode: "read",
    });
    const days = (res.data ?? []).map((d) => ({
      date: d.date,
      available: d.numAvail,
    }));
    return {
      roomId: input.roomId,
      startDate: input.startDate,
      endDate: input.endDate,
      days,
    };
  },
};
