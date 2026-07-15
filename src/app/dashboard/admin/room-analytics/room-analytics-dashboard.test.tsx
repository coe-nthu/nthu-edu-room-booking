import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type {
  DepartmentRoomBookingStatistic,
  RoomBookingStatistic,
} from "@/app/actions/admin-room-analytics";
import { RoomAnalyticsDashboard } from "@/app/dashboard/admin/room-analytics/room-analytics-dashboard";

function roomStat(
  overrides: Partial<RoomBookingStatistic>,
): RoomBookingStatistic {
  return {
    room_id: overrides.room_id ?? "room-1",
    room_name: overrides.room_name ?? "多功能教室",
    room_code: overrides.room_code ?? "101",
    floor: overrides.floor ?? "1F",
    room_type: overrides.room_type ?? "教室",
    is_active: overrides.is_active ?? true,
    total_booking_count: overrides.total_booking_count ?? 10,
    bookings_last_30_days: overrides.bookings_last_30_days ?? 3,
    bookings_last_90_days: overrides.bookings_last_90_days ?? 8,
    average_bookings_per_month: overrides.average_bookings_per_month ?? 2.5,
    first_booked_at: overrides.first_booked_at ?? "2026-01-01T00:00:00Z",
    last_booked_at: overrides.last_booked_at ?? "2026-07-01T00:00:00Z",
    most_booked_weekday: overrides.most_booked_weekday ?? "星期三",
    most_booked_weekday_count: overrides.most_booked_weekday_count ?? 4,
  };
}

const roomStats = [
  roomStat({ room_id: "room-1", room_name: "多功能教室" }),
  roomStat({
    room_id: "room-2",
    room_name: "會議室",
    room_code: "201",
    is_active: false,
  }),
];

const departmentRoomStats: DepartmentRoomBookingStatistic[] = [
  {
    ...roomStats[0],
    department_id: 1,
    department_name: "師資培育中心",
  },
  {
    ...roomStats[1],
    department_id: 2,
    department_name: "教育與學習科技學系",
  },
];

describe("RoomAnalyticsDashboard", () => {
  it("switches between room and department analysis in one table", async () => {
    const user = userEvent.setup();
    render(
      <RoomAnalyticsDashboard
        roomStats={roomStats}
        departmentRoomStats={departmentRoomStats}
      />,
    );

    expect(screen.queryByRole("columnheader", { name: "借用單位" })).toBeNull();
    expect(screen.getByText("每列代表一個空間的整體借用情形")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "單位 × 空間" }));

    expect(screen.getByRole("columnheader", { name: "借用單位" })).toBeTruthy();
    expect(screen.getByText("師資培育中心")).toBeTruthy();
  });

  it("filters rows by keyword and can clear the filter", async () => {
    const user = userEvent.setup();
    render(
      <RoomAnalyticsDashboard
        roomStats={roomStats}
        departmentRoomStats={departmentRoomStats}
      />,
    );

    await user.type(
      screen.getByPlaceholderText("搜尋空間、代號、樓層或單位"),
      "會議室",
    );

    await waitFor(() => {
      expect(screen.getByText("會議室")).toBeTruthy();
      expect(screen.queryByText("多功能教室")).toBeNull();
    });

    await user.click(screen.getByRole("button", { name: "清除篩選" }));

    expect(screen.getByText("多功能教室")).toBeTruthy();
    expect(screen.getByText("會議室")).toBeTruthy();
  });
});
