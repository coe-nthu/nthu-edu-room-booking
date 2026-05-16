import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  isSameDay,
  isDateWithin4Months,
  isDateInLockedPeriod,
  isDateInSemester,
  type SemesterSetting,
} from "@/utils/semester";

const bookingSlotSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
});

const singleBookingSchema = z.object({
  roomId: z.string().uuid(),
  purpose: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
});

const batchBookingSchema = z.object({
  roomId: z.string().uuid(),
  purpose: z.string().min(1),
  recurrenceFrequency: z.enum(["daily", "weekly"]).nullable().optional(),
  recurrenceUntil: z.string().datetime().nullable().optional(),
  slots: z.array(bookingSlotSchema).min(1).max(120),
});

const createBookingSchema = z.union([singleBookingSchema, batchBookingSchema]);

type BookingInput = {
  startTime: string;
  endTime: string;
};

type UnavailablePeriod = {
  day: number; // 0-6, 0 is Sunday
  start: string; // "HH:mm"
  end: string; // "HH:mm"
};

type RoomForBooking = {
  unavailable_periods: unknown;
  room_type: string | null;
  is_active: boolean | null;
  allow_noon: boolean | null;
  admin_only: boolean | null;
};

function getBookingValidationError(
  slot: BookingInput,
  room: RoomForBooking,
  semesters: SemesterSetting[],
  isAdmin: boolean,
) {
  const startTime = new Date(slot.startTime);
  const endTime = new Date(slot.endTime);

  if (startTime >= endTime) {
    return "結束時間必須晚於開始時間";
  }

  if (!isSameDay(startTime, endTime)) {
    return "每次預約僅能借用單日，不能跨日連續借用";
  }

  const isMeetingRoom = room.room_type === "Meeting";

  if (!isAdmin) {
    const today = new Date();
    const minDate = new Date();
    minDate.setDate(today.getDate() + 7);
    minDate.setHours(0, 0, 0, 0);

    if (startTime < minDate) {
      return "一般使用者需於 7 天前申請";
    }

    if (!isDateWithin4Months(startTime)) {
      return "一般使用者僅能借用未來 4 個月內的日期";
    }

    if (!isMeetingRoom && isDateInLockedPeriod(startTime, semesters, false)) {
      return "下學期課表尚未確認，暫不開放預約";
    }

    if (!room.allow_noon) {
      const twStart = new Date(startTime.getTime() + 8 * 60 * 60 * 1000);
      const twEnd = new Date(endTime.getTime() + 8 * 60 * 60 * 1000);
      const startMins = twStart.getUTCHours() * 60 + twStart.getUTCMinutes();
      const endMins = twEnd.getUTCHours() * 60 + twEnd.getUTCMinutes();
      const lunchStart = 12 * 60;
      const lunchEnd = 13 * 60;

      if (Math.max(startMins, lunchStart) < Math.min(endMins, lunchEnd)) {
        return "中午 12:00 - 13:00 不開放借用";
      }
    }
  }

  if (room.unavailable_periods && Array.isArray(room.unavailable_periods)) {
    const isInSemester = semesters.some((semester) =>
      isDateInSemester(startTime, semester),
    );

    if (isInSemester) {
      const periods = room.unavailable_periods as UnavailablePeriod[];
      const twStart = new Date(startTime.getTime() + 8 * 60 * 60 * 1000);
      const twEnd = new Date(endTime.getTime() + 8 * 60 * 60 * 1000);
      const bookingDay = twStart.getUTCDay();
      const bookingStartMins =
        twStart.getUTCHours() * 60 + twStart.getUTCMinutes();
      const bookingEndMins = twEnd.getUTCHours() * 60 + twEnd.getUTCMinutes();

      for (const period of periods) {
        if (period.day !== bookingDay) continue;

        const [periodStartHour, periodStartMinute] = period.start
          .split(":")
          .map(Number);
        const [periodEndHour, periodEndMinute] = period.end
          .split(":")
          .map(Number);
        const periodStartMins = periodStartHour * 60 + periodStartMinute;
        const periodEndMins = periodEndHour * 60 + periodEndMinute;

        if (
          Math.max(bookingStartMins, periodStartMins) <
          Math.min(bookingEndMins, periodEndMins)
        ) {
          return `此時段 (${period.start}-${period.end}) 不開放借用`;
        }
      }
    }
  }

  return null;
}

function getBatchOverlapError(slots: BookingInput[]) {
  const sortedSlots = [...slots].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  for (let index = 1; index < sortedSlots.length; index += 1) {
    const previous = sortedSlots[index - 1];
    const current = sortedSlots[index];

    if (new Date(previous.endTime) > new Date(current.startTime)) {
      return "送出的多個時段彼此重疊，請重新選擇";
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const body = createBookingSchema.parse(json);
    const slots: BookingInput[] =
      "slots" in body
        ? body.slots
        : [{ startTime: body.startTime, endTime: body.endTime }];
    const isBatchRequest = "slots" in body;

    // Fetch user profile for role check
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";

    // Fetch room info first (need room_type for semester lock check)
    const { data: room } = await supabase
      .from("rooms")
      .select(
        "unavailable_periods, room_type, is_active, allow_noon, admin_only",
      )
      .eq("id", body.roomId)
      .single();

    if (!room) {
      return NextResponse.json({ error: "空間不存在" }, { status: 404 });
    }

    if (room.is_active === false && !isAdmin) {
      return NextResponse.json({ error: "此空間已停用" }, { status: 400 });
    }

    if (room.admin_only && !isAdmin) {
      return NextResponse.json(
        { error: "此空間僅限管理員借用" },
        { status: 403 },
      );
    }

    // Fetch semester settings for date restrictions
    const { data: semesterData } = await supabase
      .from("semester_settings")
      .select("*")
      .order("start_date", { ascending: true });

    const semesters: SemesterSetting[] = semesterData || [];

    for (const slot of slots) {
      const validationError = getBookingValidationError(
        slot,
        room,
        semesters,
        isAdmin,
      );

      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }
    }

    const batchOverlapError = getBatchOverlapError(slots);
    if (batchOverlapError) {
      return NextResponse.json({ error: batchOverlapError }, { status: 400 });
    }

    const earliestStart = slots.reduce(
      (earliest, slot) =>
        slot.startTime < earliest ? slot.startTime : earliest,
      slots[0].startTime,
    );
    const latestEnd = slots.reduce(
      (latest, slot) => (slot.endTime > latest ? slot.endTime : latest),
      slots[0].endTime,
    );

    // Check for overlapping bookings in one broad query, then match per slot in memory.
    const { data: overlaps, error: overlapError } = await supabase
      .from("bookings")
      .select("id, start_time, end_time")
      .eq("room_id", body.roomId)
      .in("status", ["pending", "approved"])
      .filter("start_time", "lt", latestEnd)
      .filter("end_time", "gt", earliestStart);

    if (overlapError) {
      console.error(overlapError);
      return NextResponse.json({ error: "系統錯誤" }, { status: 500 });
    }

    const hasOverlap = slots.some((slot) =>
      (overlaps ?? []).some((booking) => {
        const bookingStart = new Date(booking.start_time).getTime();
        const bookingEnd = new Date(booking.end_time).getTime();
        const slotStart = new Date(slot.startTime).getTime();
        const slotEnd = new Date(slot.endTime).getTime();

        return bookingStart < slotEnd && bookingEnd > slotStart;
      }),
    );

    if (hasOverlap) {
      return NextResponse.json({ error: "該時段已被預約" }, { status: 409 });
    }

    const recurrenceGroupId =
      isBatchRequest && slots.length > 1 ? crypto.randomUUID() : null;
    const rowsToInsert = slots.map((slot) => ({
      user_id: user.id,
      room_id: body.roomId,
      start_time: slot.startTime,
      end_time: slot.endTime,
      purpose: body.purpose,
      recurrence_group_id: recurrenceGroupId,
      recurrence_frequency:
        isBatchRequest && slots.length > 1
          ? (body.recurrenceFrequency ?? null)
          : null,
      recurrence_until:
        isBatchRequest && slots.length > 1
          ? (body.recurrenceUntil ?? null)
          : null,
      status: isAdmin ? "approved" : "pending",
    }));

    const { data: bookings, error: createError } = await supabase
      .from("bookings")
      .insert(rowsToInsert)
      .select();

    if (createError) {
      console.error(createError);
      return NextResponse.json({ error: "建立預約失敗" }, { status: 500 });
    }

    // Create approval steps if the room has multi-level approvers (non-admin bookings only)
    if (!isAdmin && bookings && bookings.length > 0) {
      try {
        const supabaseAdmin = createServiceClient();
        const { data: approvers } = await supabaseAdmin
          .from("room_approvers")
          .select("user_id, step_order, label")
          .eq("room_id", body.roomId)
          .order("step_order");

        if (approvers && approvers.length > 0) {
          const steps = approvers.map((approver) => ({
            booking_id: bookings[0].id,
            step_order: approver.step_order,
            approver_id: approver.user_id,
            label: approver.label,
            status: "pending",
          }));
          await supabaseAdmin.from("booking_approval_steps").insert(steps);
        }
      } catch (err) {
        console.error("Error creating approval steps:", err);
        // Non-fatal: booking is still created
      }
    }

    if (isBatchRequest) {
      return NextResponse.json({
        bookings,
        createdCount: bookings?.length ?? 0,
      });
    }

    return NextResponse.json(bookings?.[0] ?? null);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "無效的資料格式" }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
