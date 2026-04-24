import { z } from "zod";
import type { Beds24Envelope } from "../beds24/types.js";
import type { ToolDefinition } from "./index.js";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be ISO 8601: YYYY-MM-DD");

const inputSchema = z.object({
  roomId: z.number().int().positive().describe("Beds24 room id."),
  arrival: isoDate.describe("Arrival date, YYYY-MM-DD."),
  departure: isoDate.describe("Departure date, YYYY-MM-DD."),
  numAdult: z.number().int().positive().describe("Number of adult guests."),
  numChild: z.number().int().nonnegative().optional(),
  guestFirstName: z.string().min(1),
  guestName: z.string().min(1).describe("Guest last name / family name."),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional(),
  price: z
    .number()
    .nonnegative()
    .optional()
    .describe("Total price for the stay, in the room's currency."),
  status: z
    .enum(["confirmed", "new", "request", "black"])
    .optional()
    .describe("Defaults to 'confirmed'."),
  notes: z.string().optional(),
});
type Input = z.infer<typeof inputSchema>;

export const createBooking: ToolDefinition<Input> = {
  name: "create_booking",
  title: "Create booking",
  description:
    "Create a new booking. Required: room, arrival, departure, guest first name, guest name, number of adults. All other fields optional. WRITE operation — the MCP client should confirm with the user before executing.",
  inputSchema,
  destructiveHint: true,
  requiresWrite: true,
  execute: async (input, ctx) => {
    const payload = [
      {
        roomId: input.roomId,
        status: input.status ?? "confirmed",
        arrival: input.arrival,
        departure: input.departure,
        numAdult: input.numAdult,
        numChild: input.numChild ?? 0,
        guestFirstName: input.guestFirstName,
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        guestPhone: input.guestPhone,
        price: input.price,
        notes: input.notes,
      },
    ];
    const res = await ctx.client.request<
      Beds24Envelope<{ id: number }[]>
    >({
      method: "POST",
      path: "/bookings",
      body: payload,
      mode: "write",
    });
    const created = (res.data ?? [])[0];
    return {
      id: created?.id ?? null,
      status: input.status ?? "confirmed",
      arrival: input.arrival,
      departure: input.departure,
      guest: `${input.guestFirstName} ${input.guestName}`,
    };
  },
};
