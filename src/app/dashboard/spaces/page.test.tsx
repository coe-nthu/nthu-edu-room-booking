import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Room } from "@/utils/supabase/queries";

const {
  cookiesMock,
  createClientMock,
  getRoomCardsMock,
  hasSupabaseAuthCookieMock,
} = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  createClientMock: vi.fn(),
  getRoomCardsMock: vi.fn(),
  hasSupabaseAuthCookieMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@/utils/supabase/auth-cookies", () => ({
  hasSupabaseAuthCookie: hasSupabaseAuthCookieMock,
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/utils/supabase/queries", () => ({
  getRoomCards: getRoomCardsMock,
}));

vi.mock("./space-list", () => ({
  SpaceList: ({ initialRooms }: { initialRooms: Room[] }) => (
    <div data-testid="room-list">
      {initialRooms.map((room) => room.id).join(",")}
    </div>
  ),
}));

function room(overrides: Partial<Room>): Room {
  return {
    id: overrides.id ?? "room",
    name: overrides.name ?? "Room",
    room_code: overrides.room_code ?? null,
    capacity: overrides.capacity ?? null,
    unavailable_periods: overrides.unavailable_periods ?? null,
    equipment: overrides.equipment ?? null,
    floor: overrides.floor ?? null,
    room_type: overrides.room_type ?? null,
    image_url: overrides.image_url ?? null,
    image_urls: overrides.image_urls ?? null,
    is_active: overrides.is_active ?? true,
    allow_noon: overrides.allow_noon ?? false,
    admin_only: overrides.admin_only ?? false,
  };
}

describe("SpacesPage", () => {
  beforeEach(() => {
    cookiesMock.mockResolvedValue({ getAll: () => [] });
    createClientMock.mockReset();
    getRoomCardsMock.mockReset();
    hasSupabaseAuthCookieMock.mockReset();
  });

  it("uses the admin room-card query and keeps admin-only rooms for admins", async () => {
    const supabase = {
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: { id: "admin-1" } },
        })),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(async () => ({
          data: { role: "admin" },
        })),
      })),
    };
    createClientMock.mockResolvedValue(supabase);
    hasSupabaseAuthCookieMock.mockReturnValue(true);
    getRoomCardsMock.mockResolvedValue([
      room({ id: "open-room" }),
      room({ id: "admin-room", admin_only: true }),
      room({ id: "inactive-admin-room", is_active: false, admin_only: true }),
      room({ id: "disabled-room", is_active: false, admin_only: false }),
    ]);

    const { default: SpacesPage } = await import("./page");
    render(await SpacesPage());

    expect(getRoomCardsMock).toHaveBeenCalledWith(true);
    expect(screen.getByTestId("room-list")).toHaveTextContent(
      "open-room,admin-room,inactive-admin-room",
    );
    expect(screen.getByTestId("room-list")).not.toHaveTextContent(
      "disabled-room",
    );
  });

  it("filters admin-only rooms for non-admin visitors", async () => {
    hasSupabaseAuthCookieMock.mockReturnValue(false);
    getRoomCardsMock.mockResolvedValue([
      room({ id: "open-room" }),
      room({ id: "admin-room", admin_only: true }),
    ]);

    const { default: SpacesPage } = await import("./page");
    render(await SpacesPage());

    expect(getRoomCardsMock).toHaveBeenCalledWith(false);
    expect(screen.getByTestId("room-list")).toHaveTextContent("open-room");
    expect(screen.getByTestId("room-list")).not.toHaveTextContent("admin-room");
  });
});
