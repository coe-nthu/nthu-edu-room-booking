import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import { canUserCancelBooking } from "@/lib/booking-cancellation";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const bookingId = (await params).id;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership and status before cancelling
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("user_id, status, start_time")
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!canUserCancelBooking(booking.status, booking.start_time)) {
    return NextResponse.json(
      { error: "只能取消尚未開始的待審核或已核准預約" },
      { status: 400 },
    );
  }

  const supabaseAdmin = createServiceClient();
  const { error: updateError } = await supabaseAdmin
    .from("bookings")
    .update({ status: "cancelled_by_user" })
    .eq("id", bookingId);

  if (updateError) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  // If the booking was still moving through a multi-level approval flow,
  // stop any remaining approver tasks once the applicant withdraws it.
  const { error: stepUpdateError } = await supabaseAdmin
    .from("booking_approval_steps")
    .update({
      status: "skipped",
      decided_at: new Date().toISOString(),
      comment: "使用者取消預約",
    })
    .eq("booking_id", bookingId)
    .eq("status", "pending");

  if (stepUpdateError) {
    console.error(
      "Failed to skip pending approval steps after cancellation:",
      stepUpdateError,
    );
  }

  return NextResponse.json({ success: true });
}
