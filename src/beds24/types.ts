export interface Beds24Property {
  id: number;
  name: string;
  currency?: string;
  city?: string;
  country?: string;
  timeZone?: string;
}

export interface Beds24Room {
  id: number;
  propertyId: number;
  name: string;
  qty?: number;
  maxPeople?: number;
}

export interface Beds24Booking {
  id: number;
  propertyId: number;
  roomId: number;
  status: string;
  arrival: string;
  departure: string;
  numAdult: number;
  numChild?: number;
  guestFirstName?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  channel?: string;
  referer?: string;
  price?: number;
  currency?: string;
  notes?: string;
  bookingTime?: string;
  modifiedTime?: string;
}

export interface Beds24Message {
  id: number;
  bookingId: number;
  source: "guest" | "host" | "system";
  message: string;
  time: string;
  read?: boolean;
}

export interface Beds24CalendarEntry {
  roomId: number;
  date: string;
  numAvail?: number;
  price1?: number;
  minStay?: number;
  maxStay?: number;
}

export interface Beds24AvailabilityEntry {
  roomId: number;
  date: string;
  numAvail: number;
}

export interface Beds24Envelope<T> {
  success: boolean;
  data?: T;
  errors?: { code?: number; message: string }[];
  count?: number;
  pages?: { total: number; next?: string };
}
