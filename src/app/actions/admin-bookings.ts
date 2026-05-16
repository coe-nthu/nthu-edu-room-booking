"use server";

import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import { revalidatePath } from "next/cache";

// Ensure current user is admin
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Forbidden");
  return supabase;
}

export async function deleteBooking(bookingId: string) {
  await requireAdmin();
  const supabaseAdmin = createServiceClient();
  const { data: booking } = await supabaseAdmin
    .from("bookings")
    .select("recurrence_group_id")
    .eq("id", bookingId)
    .single();

  if (!booking) {
    throw new Error("找不到此預約");
  }

  const deleteQuery = supabaseAdmin.from("bookings").delete();
  const { error } = booking.recurrence_group_id
    ? await deleteQuery.eq("recurrence_group_id", booking.recurrence_group_id)
    : await deleteQuery.eq("id", bookingId);

  if (error) {
    throw error;
  }

  revalidatePath("/dashboard/admin/approvals");
}
