import type { z } from "zod";
import type { Beds24Client } from "../beds24/client.js";

export interface ToolContext {
  client: Beds24Client;
  hasWriteCapability: boolean;
}

export interface ToolDefinition<TInput = unknown> {
  name: string;
  title?: string;
  description: string;
  inputSchema: z.ZodType<TInput>;
  destructiveHint?: boolean;
  readOnlyHint?: boolean;
  requiresWrite?: boolean;
  execute: (input: TInput, ctx: ToolContext) => Promise<unknown> | unknown;
}

// The registry holds tools with heterogeneous input types. TypeScript's
// contravariance on function parameters forbids storing them all under a
// single ToolDefinition<unknown> — so the runtime-erased shape is kept here
// and each tool's zod schema validates its own input at call time.
export type RegisteredTool = Omit<
  ToolDefinition,
  "execute" | "inputSchema"
> & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputSchema: z.ZodType<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: (input: any, ctx: ToolContext) => Promise<unknown> | unknown;
};

import { listProperties } from "./list-properties.js";
import { listRooms } from "./list-rooms.js";
import { checkAvailability } from "./check-availability.js";
import { searchBookings } from "./search-bookings.js";
import { getBooking } from "./get-booking.js";
import { getPrices } from "./get-prices.js";
import { createBooking } from "./create-booking.js";
import { cancelBooking } from "./cancel-booking.js";
import { setPrices } from "./set-prices.js";
import { sendGuestMessage } from "./send-guest-message.js";

export function buildToolList(ctx: ToolContext): RegisteredTool[] {
  const all: RegisteredTool[] = [
    listProperties,
    listRooms,
    checkAvailability,
    searchBookings,
    getBooking,
    getPrices,
    createBooking,
    cancelBooking,
    setPrices,
    sendGuestMessage,
  ];

  return all.filter((t) => !t.requiresWrite || ctx.hasWriteCapability);
}
