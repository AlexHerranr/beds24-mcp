import { z } from "zod";
import type { Beds24Booking, Beds24Envelope } from "../beds24/types.js";
import { paginate, paginationSchema } from "../utils/pagination.js";
import type { ToolDefinition } from "./index.js";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be ISO 8601: YYYY-MM-DD");

const inputSchema = paginationSchema.extend({
  propertyId: z.number().int().positive().optional(),
  roomId: z.number().int().positive().optional(),
  status: z
    .enum(["confirmed", "new", "request", "cancelled", "black"])
    .optional()
    .describe("Filter by booking status."),
  arrivalFrom: isoDate.optional().describe("Arrival date range start."),
  arrivalTo: isoDate.optional().describe("Arrival date range end."),
  departureFrom: isoDate.optional().describe("Departure date range start."),
  departureTo: isoDate.optional().describe("Departure date range end."),
  guestName: z
    .string()
    .min(2)
    .optional()
    .describe("Partial guest name match."),
});
type Input = z.infer<typeof inputSchema>;

export const searchBookings: ToolDefinition<Input> = {
  name: "search_bookings",
  title: "Search bookings",
  description:
    "Search bookings by property, room, status, arrival/departure range, or guest name. Returns a paginated list of compact booking summaries.",
  inputSchema,
  readOnlyHint: true,
  execute: async (input, ctx) => {
    const res = await ctx.client.request<Beds24Envelope<Beds24Booking[]>>({
      path: "/bookings",
      query: {
        propertyId: input.propertyId,
        roomId: input.roomId,
        status: input.status,
        arrivalFrom: input.arrivalFrom,
        arrivalTo: input.arrivalTo,
        departureFrom: input.departureFrom,
        departureTo: input.departureTo,
        guestName: input.guestName,
      },
      mode: "read",
    });
    const all = (res.data ?? []).map((b) => ({
      id: b.id,
      propertyId: b.propertyId,
      roomId: b.roomId,
      status: b.status,
      arrival: b.arrival,
      departure: b.departure,
      guest:
        [b.guestFirstName, b.guestName].filter(Boolean).join(" ").trim() ||
        null,
      channel: b.channel ?? b.referer ?? null,
      price: b.price ?? null,
      currency: b.currency ?? null,
    }));
    return paginate(all, input);
  },
};
