import type { Booking } from "@/utils/supabase/queries";

const USER_CANCELLABLE_STATUSES = new Set<Booking["status"]>([
  "pending",
  "approved",
]);

export function canUserCancelBooking(
  status: Booking["status"],
  startTime: string,
  now = new Date(),
) {
  const startAt = new Date(startTime);

  if (Number.isNaN(startAt.getTime())) return false;

  return USER_CANCELLABLE_STATUSES.has(status) && startAt > now;
}
