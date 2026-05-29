import { createServiceClient } from "@/utils/supabase/service";
import {
  sortRecurringSlots,
  type RecurringBookingSlot,
} from "@/lib/booking-series";
import type { Booking } from "./queries";

const DEFAULT_ADMIN_BOOKINGS_PAGE_SIZE = 50;
const MAX_ADMIN_BOOKINGS_PAGE_SIZE = 100;

function clampPageSize(pageSize?: number) {
  if (!Number.isFinite(pageSize)) return DEFAULT_ADMIN_BOOKINGS_PAGE_SIZE;
  return Math.min(
    Math.max(Math.trunc(pageSize ?? DEFAULT_ADMIN_BOOKINGS_PAGE_SIZE), 1),
    MAX_ADMIN_BOOKINGS_PAGE_SIZE,
  );
}

function normalizePage(page?: number) {
  if (!Number.isFinite(page)) return 1;
  return Math.max(Math.trunc(page ?? 1), 1);
}

export type ApprovalStepInfo = {
  id: string;
  step_order: number;
  approver_id: string;
  label: string | null;
  status: "pending" | "approved" | "rejected" | "skipped";
  decided_at: string | null;
  comment: string | null;
  approver?: {
    full_name: string | null;
  };
};

export type AdminBooking = Booking & {
  user_id?: string;
  user: {
    full_name: string;
    email: string;
    student_id: string | null;
    department: {
      name: string;
    } | null;
  };
  approval_steps?: ApprovalStepInfo[];
  has_multi_level_approval?: boolean;
  current_approval_label?: string | null;
  recurrence_group_id?: string | null;
  recurrence_frequency?: "daily" | "weekly" | null;
  recurrence_until?: string | null;
  recurring_slots?: RecurringBookingSlot[];
};

export type AdminBookingsResult = {
  bookings: AdminBooking[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type AdminBookingRpcRow = Omit<
  AdminBooking,
  "room" | "user" | "recurring_slots"
> & {
  room: AdminBooking["room"] | AdminBooking["room"][] | null;
  user_profile: AdminBooking["user"] | AdminBooking["user"][] | null;
  recurring_slots: RecurringBookingSlot[] | null;
  total_count: number | null;
};

export async function getAdminBookings(filters?: {
  status?: "pending" | "approved" | "rejected" | "all";
  search?: string;
  includeHistory?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<AdminBookingsResult> {
  // This function is only called after the admin guard in the page layer.
  // Use the service client here so the admin list can reliably hydrate related
  // profile/department data instead of depending on the caller's RLS context.
  const supabase = createServiceClient();
  const page = normalizePage(filters?.page);
  const pageSize = clampPageSize(filters?.pageSize);
  const offset = (page - 1) * pageSize;

  const { data, error } = await supabase.rpc("search_admin_bookings", {
    p_status: filters?.status || "pending",
    p_search: filters?.search || null,
    p_include_history: filters?.includeHistory ?? false,
    p_limit: pageSize,
    p_offset: offset,
  });

  if (error) {
    console.error("Error fetching admin bookings:", error);
    return {
      bookings: [],
      totalCount: 0,
      page,
      pageSize,
      totalPages: 1,
    };
  }

  const rows = (data as unknown as AdminBookingRpcRow[]) || [];
  if (rows.length === 0 && page > 1) {
    return getAdminBookings({ ...filters, page: 1, pageSize });
  }

  let bookings = rows.map((booking) => {
    const { user_profile, total_count, ...bookingFields } = booking;
    void total_count;

    return {
      ...bookingFields,
      user: user_profile,
      recurring_slots: booking.recurring_slots ?? undefined,
    };
  }) as unknown as AdminBooking[];
  const totalCount = rows[0]?.total_count ?? 0;

  const userIds = [
    ...new Set(bookings.map((booking) => booking.user_id).filter(Boolean)),
  ];
  const emailByUserId = new Map<string, string>();
  if (userIds.length > 0) {
    const {
      data: { users },
    } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

    for (const user of users) {
      if (user.email && userIds.includes(user.id)) {
        emailByUserId.set(user.id, user.email);
      }
    }
  }

  // Enrich the current page with approval steps data.
  if (bookings.length > 0) {
    const bookingIds = bookings.map((b) => b.id);
    const supabaseAdmin = createServiceClient();
    const { data: allSteps } = await supabaseAdmin
      .from("booking_approval_steps")
      .select(
        `
        id, booking_id, step_order, approver_id, label, status, decided_at, comment,
        approver:profiles!booking_approval_steps_approver_id_fkey (full_name)
      `,
      )
      .in("booking_id", bookingIds)
      .order("step_order");

    if (allSteps && allSteps.length > 0) {
      const stepsMap = new Map<string, ApprovalStepInfo[]>();
      for (const step of allSteps) {
        const bookingId = (step as unknown as { booking_id: string })
          .booking_id;
        if (!stepsMap.has(bookingId)) stepsMap.set(bookingId, []);
        stepsMap.get(bookingId)!.push(step as unknown as ApprovalStepInfo);
      }

      bookings = bookings.map((b) => {
        const steps = stepsMap.get(b.id);
        if (steps && steps.length > 0) {
          // Find current pending step
          const currentStep = steps.find((s) => s.status === "pending");
          return {
            ...b,
            approval_steps: steps,
            has_multi_level_approval: true,
            current_approval_label:
              currentStep?.label ||
              (steps.every(
                (s) => s.status === "approved" || s.status === "skipped",
              )
                ? "全部核准"
                : null),
          };
        }
        return { ...b, has_multi_level_approval: false };
      });
    }
  }

  // Ensure ALL returns have valid room and user objects to prevent frontend crashes
  bookings = bookings.map((booking) => {
    const safeRoom = Array.isArray(booking.room)
      ? booking.room[0]
      : booking.room;
    const safeUser = Array.isArray(booking.user)
      ? booking.user[0]
      : booking.user;
    const safeDepartment = Array.isArray(safeUser?.department)
      ? safeUser.department[0]
      : safeUser?.department;

    return {
      ...booking,
      room: safeRoom || { name: "未知空間", room_code: "" },
      user: safeUser
        ? {
            ...safeUser,
            email: booking.user_id
              ? emailByUserId.get(booking.user_id) || ""
              : "",
            department: safeDepartment || null,
          }
        : {
            full_name: "未知使用者",
            email: "",
            student_id: "",
            username: "",
            department: null,
          },
    };
  });

  bookings = bookings.map((booking) => ({
    ...booking,
    recurring_slots: booking.recurring_slots
      ? sortRecurringSlots(booking.recurring_slots)
      : undefined,
  }));

  return {
    bookings,
    totalCount,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(totalCount / pageSize), 1),
  };
}

// Keep the old function for backward compatibility
export async function getPendingBookings(): Promise<AdminBooking[]> {
  const result = await getAdminBookings({ status: "pending" });
  return result.bookings;
}
