import { describe, expect, it } from "vitest";

import { compareFloors, compareRoomsByFloor } from "@/lib/rooms";
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

describe("compareFloors", () => {
  it("sorts basement floors before numbered floors", () => {
    expect(["8F", "1F", "B1F"].sort(compareFloors)).toEqual([
      "B1F",
      "1F",
      "8F",
    ]);
  });

  it("supports floor labels with or without F", () => {
    expect(["10", "2F", "1"].sort(compareFloors)).toEqual(["1", "2F", "10"]);
  });

  it("pushes empty and non-standard floors after recognized floors", () => {
    expect(
      ["Outdoor", null, "2F", undefined, "B1F"].sort(compareFloors),
    ).toEqual(["B1F", "2F", "Outdoor", null, undefined]);
  });
});

describe("compareRoomsByFloor", () => {
  it("sorts by floor, then room code, then name", () => {
    const rooms = [
      room({ id: "3", floor: "2F", room_code: "204", name: "C" }),
      room({ id: "1", floor: "B1F", room_code: "B102", name: "A" }),
      room({ id: "4", floor: "2F", room_code: "201", name: "D" }),
      room({ id: "2", floor: "1F", room_code: "101", name: "B" }),
    ];

    expect(rooms.sort(compareRoomsByFloor).map(({ id }) => id)).toEqual([
      "1",
      "2",
      "4",
      "3",
    ]);
  });

  it("falls back to room name when floor and code are equal", () => {
    const rooms = [
      room({ id: "b", floor: "3F", room_code: "301", name: "Beta" }),
      room({ id: "a", floor: "3F", room_code: "301", name: "Alpha" }),
    ];

    expect(rooms.sort(compareRoomsByFloor).map(({ id }) => id)).toEqual([
      "a",
      "b",
    ]);
  });
});
