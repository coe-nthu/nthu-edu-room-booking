import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createSupabaseQueryMock } from "@/test/supabase-query-mock";

const { createClientMock, createServiceClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  createServiceClientMock: vi.fn(),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/utils/supabase/service", () => ({
  createServiceClient: createServiceClientMock,
}));

function bookingRequest(body: unknown) {
  return new Request("https://example.com/api/bookings", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

async function responseJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

describe("POST /api/bookings", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-09T09:00:00+08:00"));
    createClientMock.mockReset();
    createServiceClientMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects anonymous users", async () => {
    const { client } = createSupabaseQueryMock({});
    client.auth.getUser.mockResolvedValue({ data: { user: null } });
    createClientMock.mockResolvedValue(client);
    const { POST } = await import("@/app/api/bookings/route");

    const response = await POST(bookingRequest({}));

    expect(response.status).toBe(401);
    await expect(responseJson(response)).resolves.toEqual({
      error: "Unauthorized",
    });
  });

  it("rejects invalid request bodies", async () => {
    const { client } = createSupabaseQueryMock({});
    client.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    createClientMock.mockResolvedValue(client);
    const { POST } = await import("@/app/api/bookings/route");

    const response = await POST(bookingRequest({ roomId: "not-a-uuid" }));

    expect(response.status).toBe(400);
    await expect(responseJson(response)).resolves.toEqual({
      error: "無效的資料格式",
    });
  });

  it("rejects non-admin access to admin-only rooms", async () => {
    const { client } = createSupabaseQueryMock({
      profiles: [{ data: { role: "user" }, error: null }],
      rooms: [
        {
          data: {
            unavailable_periods: [],
            room_type: "Classroom",
            is_active: true,
            allow_noon: true,
            admin_only: true,
          },
          error: null,
        },
      ],
    });
    client.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    createClientMock.mockResolvedValue(client);
    const { POST } = await import("@/app/api/bookings/route");

    const response = await POST(
      bookingRequest({
        roomId: "11111111-1111-4111-8111-111111111111",
        startTime: "2026-05-20T01:00:00.000Z",
        endTime: "2026-05-20T02:00:00.000Z",
        purpose: "Team meeting",
      }),
    );

    expect(response.status).toBe(403);
    await expect(responseJson(response)).resolves.toEqual({
      error: "此空間僅限管理員借用",
    });
  });

  it("rejects overlapping bookings", async () => {
    const { client } = createSupabaseQueryMock({
      profiles: [{ data: { role: "user" }, error: null }],
      rooms: [
        {
          data: {
            unavailable_periods: [],
            room_type: "Meeting",
            is_active: true,
            allow_noon: true,
            admin_only: false,
          },
          error: null,
        },
      ],
      semester_settings: [{ data: [], error: null }],
      bookings: [{ data: [{ id: "existing-booking" }], error: null }],
    });
    client.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    createClientMock.mockResolvedValue(client);
    const { POST } = await import("@/app/api/bookings/route");

    const response = await POST(
      bookingRequest({
        roomId: "11111111-1111-4111-8111-111111111111",
        startTime: "2026-05-20T01:00:00.000Z",
        endTime: "2026-05-20T02:00:00.000Z",
        purpose: "Team meeting",
      }),
    );

    expect(response.status).toBe(409);
    await expect(responseJson(response)).resolves.toEqual({
      error: "該時段已被預約",
    });
  });

  it("creates pending bookings for regular users", async () => {
    const { client, calls } = createSupabaseQueryMock({
      profiles: [{ data: { role: "user" }, error: null }],
      rooms: [
        {
          data: {
            unavailable_periods: [],
            room_type: "Meeting",
            is_active: true,
            allow_noon: true,
            admin_only: false,
          },
          error: null,
        },
      ],
      semester_settings: [{ data: [], error: null }],
      bookings: [
        { data: [], error: null },
        { data: { id: "new-booking", status: "pending" }, error: null },
      ],
    });
    const serviceClient = createSupabaseQueryMock({
      room_approvers: [{ data: [], error: null }],
    }).client;
    client.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    createClientMock.mockResolvedValue(client);
    createServiceClientMock.mockReturnValue(serviceClient);
    const { POST } = await import("@/app/api/bookings/route");

    const response = await POST(
      bookingRequest({
        roomId: "11111111-1111-4111-8111-111111111111",
        startTime: "2026-05-20T01:00:00.000Z",
        endTime: "2026-05-20T02:00:00.000Z",
        purpose: "Team meeting",
      }),
    );

    expect(response.status).toBe(200);
    await expect(responseJson(response)).resolves.toEqual({
      id: "new-booking",
      status: "pending",
    });
    expect(calls).toContainEqual(
      expect.objectContaining({
        table: "bookings",
        method: "insert",
        args: [
          expect.objectContaining({
            user_id: "user-1",
            status: "pending",
          }),
        ],
      }),
    );
  });
});
