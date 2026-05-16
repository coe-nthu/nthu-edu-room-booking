export type RecurrenceFrequency = "none" | "daily" | "weekly";

export type BookingSlot = {
  start: Date;
  end: Date;
};

function startOfLocalDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function copySlotToDate(slot: BookingSlot, date: Date): BookingSlot {
  const start = new Date(date);
  start.setHours(
    slot.start.getHours(),
    slot.start.getMinutes(),
    slot.start.getSeconds(),
    slot.start.getMilliseconds(),
  );

  const end = new Date(date);
  end.setHours(
    slot.end.getHours(),
    slot.end.getMinutes(),
    slot.end.getSeconds(),
    slot.end.getMilliseconds(),
  );

  return { start, end };
}

export function buildRecurringSlots(
  baseSlot: BookingSlot,
  frequency: RecurrenceFrequency,
  repeatUntil?: Date,
) {
  if (frequency === "none") {
    return [baseSlot];
  }

  if (!repeatUntil) {
    return [baseSlot];
  }

  const slots: BookingSlot[] = [];
  const startDay = startOfLocalDay(baseSlot.start);
  const endDay = startOfLocalDay(repeatUntil);
  const stepDays = frequency === "daily" ? 1 : 7;

  for (
    let cursor = new Date(startDay);
    cursor <= endDay;
    cursor.setDate(cursor.getDate() + stepDays)
  ) {
    slots.push(copySlotToDate(baseSlot, cursor));
  }

  return slots;
}

export function getRecurrenceLabel(frequency: RecurrenceFrequency) {
  switch (frequency) {
    case "daily":
      return "每天重複";
    case "weekly":
      return "每週重複";
    default:
      return "單次申請";
  }
}
