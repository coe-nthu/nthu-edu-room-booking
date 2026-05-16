import { describe, expect, it } from "vitest";

import { canUserCancelBooking } from "@/lib/booking-cancellation";

const now = new Date("2026-05-16T09:00:00.000Z");
const futureStart = "2026-05-20T09:00:00.000Z";
const pastStart = "2026-05-10T09:00:00.000Z";

describe("canUserCancelBooking", () => {
  it("allows future pending and approved bookings", () => {
    expect(canUserCancelBooking("pending", futureStart, now)).toBe(true);
    expect(canUserCancelBooking("approved", futureStart, now)).toBe(true);
  });

  it("rejects non-active or already-started bookings", () => {
    expect(canUserCancelBooking("rejected", futureStart, now)).toBe(false);
    expect(canUserCancelBooking("cancelled_by_user", futureStart, now)).toBe(
      false,
    );
    expect(canUserCancelBooking("approved", pastStart, now)).toBe(false);
  });
});
