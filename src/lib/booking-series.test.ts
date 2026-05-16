import { describe, expect, it } from "vitest";

import { getRecurrenceSummary, sortRecurringSlots } from "@/lib/booking-series";

describe("booking series helpers", () => {
  it("formats recurring booking labels", () => {
    expect(getRecurrenceSummary("weekly", "2026-06-29T16:00:00.000Z")).toEqual({
      label: "每週借用",
      until: "2026-06-29T16:00:00.000Z",
    });
    expect(getRecurrenceSummary(null, null)).toBeNull();
  });

  it("sorts recurring slots chronologically", () => {
    expect(
      sortRecurringSlots([
        {
          id: "b",
          start_time: "2026-06-15T01:00:00.000Z",
          end_time: "2026-06-15T02:00:00.000Z",
          status: "pending",
        },
        {
          id: "a",
          start_time: "2026-06-08T01:00:00.000Z",
          end_time: "2026-06-08T02:00:00.000Z",
          status: "pending",
        },
      ]).map((slot) => slot.id),
    ).toEqual(["a", "b"]);
  });
});
