import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ROOM_CARD_COLUMNS,
  ROOM_DETAIL_COLUMNS,
} from "@/utils/supabase/queries";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: createClientMock,
}));

type QueryResult = {
  data: unknown;
  error: unknown;
};

function createQuery(result: QueryResult) {
  const query = {
    select: vi.fn(() => query),
    order: vi.fn(() => query),
    eq: vi.fn(() => query),
    single: vi.fn(async () => result),
    then: (
      resolve: (value: QueryResult) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(resolve, reject),
  };

  return query;
}

describe("room query helpers", () => {
  beforeEach(() => {
    createClientMock.mockReset();
  });

  it("fetches active room details by default", async () => {
    const query = createQuery({ data: [{ id: "room-1" }], error: null });
    createClientMock.mockResolvedValue({
      from: vi.fn(() => query),
    });
    const { getRooms } = await import("@/utils/supabase/queries");

    const rooms = await getRooms();

    expect(rooms).toEqual([{ id: "room-1" }]);
    expect(query.select).toHaveBeenCalledWith(ROOM_DETAIL_COLUMNS);
    expect(query.order).toHaveBeenCalledWith("name");
    expect(query.eq).toHaveBeenCalledWith("is_active", true);
  });

  it("can include inactive room details", async () => {
    const query = createQuery({ data: [], error: null });
    createClientMock.mockResolvedValue({
      from: vi.fn(() => query),
    });
    const { getRooms } = await import("@/utils/supabase/queries");

    await getRooms(true);

    expect(query.eq).not.toHaveBeenCalledWith("is_active", true);
  });

  it("fetches lightweight room card columns", async () => {
    const query = createQuery({
      data: [{ id: "room-1", image_url: "image.jpg" }],
      error: null,
    });
    createClientMock.mockResolvedValue({
      from: vi.fn(() => query),
    });
    const { getRoomCards } = await import("@/utils/supabase/queries");

    const rooms = await getRoomCards();

    expect(rooms).toEqual([{ id: "room-1", image_url: "image.jpg" }]);
    expect(query.select).toHaveBeenCalledWith(ROOM_CARD_COLUMNS);
    expect(query.eq).toHaveBeenCalledWith("is_active", true);
  });

  it("returns an empty list on room-card query errors", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const query = createQuery({ data: null, error: new Error("db down") });
    createClientMock.mockResolvedValue({
      from: vi.fn(() => query),
    });
    const { getRoomCards } = await import("@/utils/supabase/queries");

    await expect(getRoomCards()).resolves.toEqual([]);

    consoleErrorSpy.mockRestore();
  });
});
