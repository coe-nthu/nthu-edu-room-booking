"use server";

import { createClient } from "@/utils/supabase/server";

export type RoomBookingStatistic = {
  room_id: string;
  room_name: string;
  room_code: string | null;
  floor: string | null;
  room_type: string | null;
  is_active: boolean | null;
  total_booking_count: number;
  bookings_last_30_days: number;
  bookings_last_90_days: number;
  average_bookings_per_month: number;
  first_booked_at: string | null;
  last_booked_at: string | null;
  most_booked_weekday: string | null;
  most_booked_weekday_count: number;
};

export type DepartmentRoomBookingStatistic = RoomBookingStatistic & {
  department_id: number | null;
  department_name: string;
};

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Forbidden: Admin access required");
  }

  return supabase;
}

export async function getRoomBookingStatistics(): Promise<
  RoomBookingStatistic[]
> {
  const supabase = await requireAdmin();

  const { data, error } = await supabase
    .from("room_booking_statistics")
    .select("*")
    .order("total_booking_count", { ascending: false })
    .order("room_name", { ascending: true });

  if (error) {
    console.error("Error fetching room booking statistics:", error);
    return [];
  }

  return data as RoomBookingStatistic[];
}

export async function getRoomBookingStatisticsByDepartment(): Promise<
  DepartmentRoomBookingStatistic[]
> {
  const supabase = await requireAdmin();

  const { data, error } = await supabase
    .from("room_booking_statistics_by_department")
    .select("*")
    .order("department_name", { ascending: true })
    .order("total_booking_count", { ascending: false })
    .order("room_name", { ascending: true });

  if (error) {
    console.error("Error fetching department room booking statistics:", error);
    return [];
  }

  return data as DepartmentRoomBookingStatistic[];
}
