import { z } from "zod";
import type { Beds24Envelope } from "../beds24/types.js";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  bookingId: z.number().int().positive().describe("Beds24 booking id."),
  message: z
    .string()
    .min(1)
    .max(4000)
    .describe("Message body to send to the guest."),
});
type Input = z.infer<typeof inputSchema>;

export const sendGuestMessage: ToolDefinition<Input> = {
  name: "send_guest_message",
  title: "Send guest message",
  description:
    "Send a message to the guest of a booking through the Beds24 messaging API. WRITE operation — the MCP client should confirm with the user before executing.",
  inputSchema,
  destructiveHint: true,
  requiresWrite: true,
  execute: async (input, ctx) => {
    const payload = [
      {
        bookingId: input.bookingId,
        message: input.message,
      },
    ];
    const res = await ctx.client.request<Beds24Envelope<unknown>>({
      method: "POST",
      path: "/bookings/messages",
      body: payload,
      mode: "write",
    });
    return {
      bookingId: input.bookingId,
      sent: res.success ?? true,
    };
  },
};
