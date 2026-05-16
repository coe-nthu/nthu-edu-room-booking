import { describe, expect, it } from "vitest";

import { buildRecurringSlots } from "@/lib/booking-recurrence";

const baseSlot = {
  start: new Date("2026-05-28T09:00:00+08:00"),
  end: new Date("2026-05-28T10:00:00+08:00"),
};

describe("buildRecurringSlots", () => {
  it("returns the original slot for single bookings", () => {
    expect(buildRecurringSlots(baseSlot, "none")).toEqual([baseSlot]);
  });

  it("builds weekly occurrences through the repeat-until date", () => {
    const slots = buildRecurringSlots(
      baseSlot,
      "weekly",
      new Date("2026-06-18T00:00:00+08:00"),
    );

    expect(slots.map((slot) => slot.start.toISOString())).toEqual([
      "2026-05-28T01:00:00.000Z",
      "2026-06-04T01:00:00.000Z",
      "2026-06-11T01:00:00.000Z",
      "2026-06-18T01:00:00.000Z",
    ]);
  });

  it("builds daily occurrences without changing the selected hours", () => {
    const slots = buildRecurringSlots(
      baseSlot,
      "daily",
      new Date("2026-05-30T00:00:00+08:00"),
    );

    expect(slots).toHaveLength(3);
    expect(slots.at(-1)).toEqual({
      start: new Date("2026-05-30T09:00:00+08:00"),
      end: new Date("2026-05-30T10:00:00+08:00"),
    });
  });
});
