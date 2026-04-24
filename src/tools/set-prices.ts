import { z } from "zod";
import type { Beds24Envelope } from "../beds24/types.js";
import type { ToolDefinition } from "./index.js";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be ISO 8601: YYYY-MM-DD");

const inputSchema = z.object({
  roomId: z.number().int().positive().describe("Beds24 room id."),
  startDate: isoDate.describe("Start date (inclusive), YYYY-MM-DD."),
  endDate: isoDate.describe("End date (inclusive), YYYY-MM-DD."),
  price: z
    .number()
    .nonnegative()
    .describe("Price to set for every day in the range (rate price1)."),
  minStay: z.number().int().positive().optional(),
  maxStay: z.number().int().positive().optional(),
});
type Input = z.infer<typeof inputSchema>;

export const setPrices: ToolDefinition<Input> = {
  name: "set_prices",
  title: "Set prices",
  description:
    "Set a fixed price for every day in the given range on a room, optionally constraining minStay and maxStay. WRITE operation — the MCP client should confirm with the user before executing.",
  inputSchema,
  destructiveHint: true,
  requiresWrite: true,
  execute: async (input, ctx) => {
    const payload = [
      {
        roomId: input.roomId,
        startDate: input.startDate,
        endDate: input.endDate,
        price1: input.price,
        minStay: input.minStay,
        maxStay: input.maxStay,
      },
    ];
    const res = await ctx.client.request<Beds24Envelope<unknown>>({
      method: "POST",
      path: "/inventory/rooms/calendar",
      body: payload,
      mode: "write",
    });
    return {
      roomId: input.roomId,
      startDate: input.startDate,
      endDate: input.endDate,
      price: input.price,
      success: res.success ?? true,
    };
  },
};
