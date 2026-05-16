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

  it("redirects guests to login from the reserve button and preserves the selected slot", async () => {
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

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        "請先登入以繼續預約，已保留您選擇的時間",
      );
      expect(pushMock).toHaveBeenCalledWith(
        "/login?next=%2Fdashboard%2Fspaces%2Froom-1",
      );
    });
    expect(screen.queryByText("確認預約資訊")).not.toBeInTheDocument();
    expect(
      JSON.parse(localStorage.getItem("pendingBooking_room-1") ?? "{}"),
    ).toEqual({
      start: selectedSlot.start.toISOString(),
      end: selectedSlot.end.toISOString(),
      purpose: "",
    });
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
    expect(fetchMock).not.toHaveBeenCalled();
    expect(localStorage.getItem("pendingBooking_room-1")).toBeNull();
    expect(onChangeMock).toHaveBeenCalledWith({
      start: selectedSlot.start,
      end: selectedSlot.end,
    });
  });
});
