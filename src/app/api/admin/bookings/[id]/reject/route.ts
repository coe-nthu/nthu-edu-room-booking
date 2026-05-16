import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const bookingId = (await params).id;
  const json = await request.json();
  const { reason } = json;

  const supabase = await createClient();

  // Admin check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("recurrence_group_id")
    .eq("id", bookingId)
    .single();

  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Reject
  const updateQuery = supabase.from("bookings").update({
    status: "rejected",
    rejection_reason: reason || null,
  });
  const { error } = booking.recurrence_group_id
    ? await updateQuery.eq("recurrence_group_id", booking.recurrence_group_id)
    : await updateQuery.eq("id", bookingId);

  if (error)
    return NextResponse.json({ error: "Update failed" }, { status: 500 });

  // TODO: Insert audit log

  return NextResponse.json({ success: true });
}
