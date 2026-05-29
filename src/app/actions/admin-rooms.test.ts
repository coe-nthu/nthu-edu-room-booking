import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSupabaseQueryMock } from "@/test/supabase-query-mock";

const { createClientMock, createServiceClientMock, revalidatePathMock } =
  vi.hoisted(() => ({
    createClientMock: vi.fn(),
    createServiceClientMock: vi.fn(),
    revalidatePathMock: vi.fn(),
  }));

vi.mock("@/utils/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/utils/supabase/service", () => ({
  createServiceClient: createServiceClientMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

describe("admin room actions", () => {
  beforeEach(() => {
    createClientMock.mockReset();
    createServiceClientMock.mockReset();
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
            image_url: null,
            image_urls: [],
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

  it("keeps the selected primary image in sync with the gallery", async () => {
    const { client, calls } = createSupabaseQueryMock({
      profiles: [{ data: { role: "admin" }, error: null }],
      rooms: [{ data: null, error: null }],
    });
    client.auth.getUser.mockResolvedValue({
      data: { user: { id: "admin-1" } },
    });
    createClientMock.mockResolvedValue(client);
    const { updateRoom } = await import("@/app/actions/admin-rooms");

    await updateRoom("room-1", {
      image_url: "secondary.jpg",
      image_urls: ["primary.jpg", "secondary.jpg"],
    });

    expect(calls).toContainEqual(
      expect.objectContaining({
        table: "rooms",
        method: "update",
        args: [
          expect.objectContaining({
            image_url: "secondary.jpg",
            image_urls: ["primary.jpg", "secondary.jpg"],
          }),
        ],
      }),
    );
  });

  it("deletes room images from storage and updates the room gallery", async () => {
    const { client } = createSupabaseQueryMock({
      profiles: [{ data: { role: "admin" }, error: null }],
    });
    const {
      client: serviceClient,
      calls: serviceCalls,
      storageCalls,
    } = createSupabaseQueryMock({
      rooms: [{ data: null, error: null }],
    });
    client.auth.getUser.mockResolvedValue({
      data: { user: { id: "admin-1" } },
    });
    createClientMock.mockResolvedValue(client);
    createServiceClientMock.mockReturnValue(serviceClient);
    const { deleteRoomImage } = await import("@/app/actions/admin-rooms");

    await expect(
      deleteRoomImage("room-images/old.jpg", {
        roomId: "room-1",
        imageUrls: ["room-images/next.jpg"],
        primaryImageUrl: "room-images/next.jpg",
      }),
    ).resolves.toEqual({
      image_url: "room-images/next.jpg",
      image_urls: ["room-images/next.jpg"],
    });

    expect(storageCalls).toContainEqual({
      bucket: "room-images",
      method: "remove",
      args: [["old.jpg"]],
    });
    expect(serviceCalls).toContainEqual(
      expect.objectContaining({
        table: "rooms",
        method: "update",
        args: [
          expect.objectContaining({
            image_url: "room-images/next.jpg",
            image_urls: ["room-images/next.jpg"],
          }),
        ],
      }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard/admin/rooms");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard/spaces");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard/spaces/room-1");
  });
});
