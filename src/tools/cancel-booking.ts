import { z } from "zod";
import type { Beds24Envelope } from "../beds24/types.js";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  id: z.number().int().positive().describe("Beds24 booking id to cancel."),
  reason: z
    .string()
    .optional()
    .describe("Optional cancellation reason appended to the booking notes."),
});
type Input = z.infer<typeof inputSchema>;

export const cancelBooking: ToolDefinition<Input> = {
  name: "cancel_booking",
  title: "Cancel booking",
  description:
    "Cancel a booking by id. Sets its status to 'cancelled'. WRITE operation — the MCP client should confirm with the user before executing.",
  inputSchema,
  destructiveHint: true,
  requiresWrite: true,
  execute: async (input, ctx) => {
    const payload = [
      {
        id: input.id,
        status: "cancelled",
        notes: input.reason,
      },
    ];
    await ctx.client.request<Beds24Envelope<unknown>>({
      method: "POST",
      path: "/bookings",
      body: payload,
      mode: "write",
    });
    return { id: input.id, status: "cancelled" };
  },
};
