import { z } from "zod";
import type { Beds24Booking, Beds24Envelope } from "../beds24/types.js";
import { ApiError } from "../utils/errors.js";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  id: z.number().int().positive().describe("Beds24 booking id."),
  includeInvoiceItems: z
    .boolean()
    .optional()
    .describe(
      "Include invoice items (charges, payments, refunds) on the returned booking.",
    ),
});
type Input = z.infer<typeof inputSchema>;

export const getBooking: ToolDefinition<Input> = {
  name: "get_booking",
  title: "Get booking",
  description:
    "Fetch the full detail of a single booking by id, optionally including invoice items.",
  inputSchema,
  readOnlyHint: true,
  execute: async (input, ctx) => {
    const res = await ctx.client.request<Beds24Envelope<Beds24Booking[]>>({
      path: "/bookings",
      query: {
        id: input.id,
        includeInvoiceItems: input.includeInvoiceItems ?? false,
      },
      mode: "read",
    });
    const booking = (res.data ?? [])[0];
    if (!booking) {
      throw new ApiError(`Booking ${input.id} not found`, 404);
    }
    return booking;
  },
};
