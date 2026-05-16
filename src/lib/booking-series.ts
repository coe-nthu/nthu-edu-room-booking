export type RecurringBookingSlot = {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
};

export type RecurrenceFrequencyValue = "daily" | "weekly" | null;

export function getRecurrenceSummary(
  frequency: RecurrenceFrequencyValue,
  until: string | null,
) {
  if (!frequency || !until) return null;

  return {
    label: frequency === "daily" ? "每天借用" : "每週借用",
    until,
  };
}

export function sortRecurringSlots<T extends { start_time: string }>(
  slots: T[],
) {
  return [...slots].sort(
    (a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
  );
}
