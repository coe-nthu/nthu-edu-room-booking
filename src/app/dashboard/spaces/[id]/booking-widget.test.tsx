import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BookingWidget } from "@/app/dashboard/spaces/[id]/booking-widget";
import type { Room } from "@/utils/supabase/queries";
import type { SemesterSetting } from "@/utils/semester";

const { pushMock, useUserMock, toastErrorMock, toastSuccessMock } = vi.hoisted(
  () => ({
    pushMock: vi.fn(),
    useUserMock: vi.fn(),
    toastErrorMock: vi.fn(),
    toastSuccessMock: vi.fn(),
  }),
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/hooks/use-user", () => ({
  useUser: useUserMock,
}));

vi.mock("sonner", () => ({
  toast: {
    error: toastErrorMock,
    success: toastSuccessMock,
  },
}));

function room(overrides: Partial<Room> = {}): Room {
  return {
    id: overrides.id ?? "room-1",
    name: overrides.name ?? "Room 1",
    room_code: overrides.room_code ?? "101",
    capacity: overrides.capacity ?? 40,
    unavailable_periods: overrides.unavailable_periods ?? null,
    equipment: overrides.equipment ?? [],
    floor: overrides.floor ?? "1F",
    room_type: overrides.room_type ?? "Meeting",
    image_url: overrides.image_url ?? null,
    is_active: overrides.is_active ?? true,
    allow_noon: overrides.allow_noon ?? true,
    admin_only: overrides.admin_only ?? false,
  };
}

const semesters: SemesterSetting[] = [];
const selectedSlot = {
  start: new Date("2026-05-28T09:00:00+08:00"),
  end: new Date("2026-05-28T10:00:00+08:00"),
};

function createLocalStorageMock(): Storage {
  let store: Record<string, string> = {};

  return {
    get length() {
      return Object.keys(store).length;
    },
    clear: vi.fn(() => {
      store = {};
    }),
    getItem: vi.fn((key: string) => store[key] ?? null),
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
  };
}

describe("BookingWidget", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal("localStorage", createLocalStorageMock());
    pushMock.mockReset();
    useUserMock.mockReset();
    toastErrorMock.mockReset();
    toastSuccessMock.mockReset();
    localStorage.clear();
    window.history.pushState({}, "", "/dashboard/spaces/room-1");
    useUserMock.mockReturnValue({ user: null, loading: false });
  });

  it("disables the reserve action until a slot is selected", () => {
    render(
      <BookingWidget
        room={room()}
        semesters={semesters}
        isAdmin={false}
        selectedSlot={null}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "預約" })).toBeDisabled();
  });

  it("lets guests configure the request before login", async () => {
    const user = userEvent.setup();

    render(
      <BookingWidget
        room={room()}
        semesters={semesters}
        isAdmin={false}
        selectedSlot={selectedSlot}
        onChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "預約" }));

    expect(await screen.findByText("確認預約資訊")).toBeInTheDocument();
    expect(screen.getByText("送出申請前需要登入")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /登入後送出申請/ }),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("opens confirmation directly for authenticated users", async () => {
    const user = userEvent.setup();
    useUserMock.mockReturnValue({
      user: { id: "user-1", email: "user@example.com" },
      loading: false,
    });

    render(
      <BookingWidget
        room={room()}
        semesters={semesters}
        isAdmin={false}
        selectedSlot={selectedSlot}
        onChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "預約" }));

    expect(await screen.findByText("確認預約資訊")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("restores a pending guest booking after login without submitting automatically", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    useUserMock.mockReturnValue({
      user: { id: "user-1", email: "user@example.com" },
      loading: false,
    });
    const onChangeMock = vi.fn();
    localStorage.setItem(
      "pendingBooking_room-1",
      JSON.stringify({
        start: selectedSlot.start.toISOString(),
        end: selectedSlot.end.toISOString(),
        purpose: "社團活動討論",
        recurrenceFrequency: "weekly",
        repeatUntil: "2026-06-18T16:00:00.000Z",
      }),
    );

    render(
      <BookingWidget
        room={room()}
        semesters={semesters}
        isAdmin={false}
        selectedSlot={selectedSlot}
        onChange={onChangeMock}
      />,
    );

    expect(await screen.findByText("已保留剛剛填寫的內容")).toBeInTheDocument();
    expect(screen.getByLabelText("借用事由")).toHaveValue("社團活動討論");
    expect(
      screen.getByRole("button", { name: "確認送出" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("共 4 筆申請：5/28、6/4、6/11、6/18"),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(localStorage.getItem("pendingBooking_room-1")).toBeNull();
    expect(onChangeMock).toHaveBeenCalledWith({
      start: selectedSlot.start,
      end: selectedSlot.end,
    });
  });

  it("submits multiple generated slots with one shared purpose", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ createdCount: 2 }),
    });
    vi.stubGlobal("fetch", fetchMock);
    useUserMock.mockReturnValue({
      user: { id: "user-1", email: "user@example.com" },
      loading: false,
    });

    render(
      <BookingWidget
        room={room()}
        semesters={semesters}
        isAdmin={false}
        selectedSlot={selectedSlot}
        onChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "預約" }));
    await user.click(screen.getByRole("button", { name: "每週重複" }));
    await user.click(screen.getByRole("button", { name: "選擇結束日期" }));
    await user.click(
      screen.getByRole("button", { name: "Thursday, June 4th, 2026" }),
    );
    await user.type(screen.getByLabelText("借用事由"), "運科實驗課");
    await user.click(screen.getByRole("button", { name: "確認送出" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/bookings",
      expect.objectContaining({
        body: JSON.stringify({
          roomId: "room-1",
          purpose: "運科實驗課",
          slots: [
            {
              startTime: "2026-05-28T01:00:00.000Z",
              endTime: "2026-05-28T02:00:00.000Z",
            },
            {
              startTime: "2026-06-04T01:00:00.000Z",
              endTime: "2026-06-04T02:00:00.000Z",
            },
          ],
        }),
      }),
    );
    expect(toastSuccessMock).toHaveBeenCalledWith("已送出 2 筆預約申請");
  });

  it("lets users expand the full recurring date list", async () => {
    const user = userEvent.setup();
    useUserMock.mockReturnValue({
      user: { id: "user-1", email: "user@example.com" },
      loading: false,
    });
    localStorage.setItem(
      "pendingBooking_room-1",
      JSON.stringify({
        start: selectedSlot.start.toISOString(),
        end: selectedSlot.end.toISOString(),
        purpose: "社團活動討論",
        recurrenceFrequency: "weekly",
        repeatUntil: "2026-07-02T16:00:00.000Z",
      }),
    );

    render(
      <BookingWidget
        room={room()}
        semesters={semesters}
        isAdmin={false}
        selectedSlot={selectedSlot}
        onChange={vi.fn()}
      />,
    );

    expect(
      await screen.findByText("共 6 筆申請：5/28、6/4、6/11、6/18"),
    ).toBeInTheDocument();
    expect(screen.queryByText("6/25")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "展開全部 6 個日期" }));

    expect(
      screen.getByText("共 6 筆申請：5/28、6/4、6/11、6/18、6/25、7/2"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "收合日期" }),
    ).toBeInTheDocument();
  });
});
