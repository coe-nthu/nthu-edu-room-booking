import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSupabaseQueryMock } from "@/test/supabase-query-mock";

const { createClientMock, revalidatePathMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

describe("admin room actions", () => {
  beforeEach(() => {
    createClientMock.mockReset();
    revalidatePathMock.mockReset();
  });

  it("requires an authenticated admin before creating rooms", async () => {
    const { client } = createSupabaseQueryMock({});
    client.auth.getUser.mockResolvedValue({ data: { user: null } });
    createClientMock.mockResolvedValue(client);
    const { createRoom } = await import("@/app/actions/admin-rooms");

    await expect(createRoom({ name: "New room" })).rejects.toThrow(
      "Unauthorized",
    );
  });

  it("creates rooms with defaults and revalidates active room pages", async () => {
    const { client, calls } = createSupabaseQueryMock({
      profiles: [{ data: { role: "admin" }, error: null }],
      rooms: [{ data: null, error: null }],
    });
    client.auth.getUser.mockResolvedValue({
      data: { user: { id: "admin-1" } },
    });
    createClientMock.mockResolvedValue(client);
    const { createRoom } = await import("@/app/actions/admin-rooms");

    await createRoom({
      name: "New room",
      room_code: "101",
      capacity: 20,
      floor: "1F",
      room_type: "Meeting",
    });

    expect(calls).toContainEqual(
      expect.objectContaining({
        table: "rooms",
        method: "insert",
        args: [
          expect.objectContaining({
            name: "New room",
            equipment: [],
            unavailable_periods: [],
            is_active: true,
            allow_noon: false,
            admin_only: false,
          }),
        ],
      }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard/admin/rooms");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard/spaces");
    expect(revalidatePathMock).not.toHaveBeenCalledWith("/dashboard/book");
  });

  it("revalidates the edited room detail page on update", async () => {
    const { client } = createSupabaseQueryMock({
      profiles: [{ data: { role: "admin" }, error: null }],
      rooms: [{ data: null, error: null }],
    });
    client.auth.getUser.mockResolvedValue({
      data: { user: { id: "admin-1" } },
    });
    createClientMock.mockResolvedValue(client);
    const { updateRoom } = await import("@/app/actions/admin-rooms");

    await updateRoom("room-1", { name: "Updated room" });

    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard/admin/rooms");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard/spaces");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard/spaces/room-1");
    expect(revalidatePathMock).not.toHaveBeenCalledWith("/dashboard/book");
  });
});
