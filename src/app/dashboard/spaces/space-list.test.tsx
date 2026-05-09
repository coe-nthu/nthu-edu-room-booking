import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { SpaceList } from "@/app/dashboard/spaces/space-list";
import type { Room } from "@/utils/supabase/queries";

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
    is_active: overrides.is_active ?? true,
    allow_noon: overrides.allow_noon ?? false,
    admin_only: overrides.admin_only ?? false,
  };
}

const rooms = [
  room({
    id: "third",
    name: "Third Floor Studio",
    room_code: "301",
    floor: "3F",
    capacity: 60,
    room_type: "Studio",
  }),
  room({
    id: "basement",
    name: "Basement Room",
    room_code: "B101",
    floor: "B1F",
    capacity: 20,
    room_type: "Meeting",
  }),
  room({
    id: "first",
    name: "First Floor Hall",
    room_code: "101",
    floor: "1F",
    capacity: 45,
    room_type: "Classroom",
  }),
];

describe("SpaceList", () => {
  it("renders rooms sorted by floor and room code", () => {
    render(<SpaceList initialRooms={rooms} />);

    expect(
      screen.getAllByRole("heading").map((heading) => heading.textContent),
    ).toEqual(["Basement Room", "First Floor Hall", "Third Floor Studio"]);
  });

  it("filters rooms by search text and shows an empty state", async () => {
    const user = userEvent.setup();
    render(<SpaceList initialRooms={rooms} />);

    await user.type(
      screen.getByPlaceholderText("搜尋空間名稱、代號..."),
      "studio",
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Third Floor Studio" }),
      ).toBeTruthy();
      expect(
        screen.queryByRole("heading", { name: "Basement Room" }),
      ).toBeNull();
    });

    await user.clear(screen.getByPlaceholderText("搜尋空間名稱、代號..."));
    await user.type(
      screen.getByPlaceholderText("搜尋空間名稱、代號..."),
      "no match",
    );

    await waitFor(() => {
      expect(screen.getByText("沒有找到符合條件的空間")).toBeTruthy();
    });
  });
});
