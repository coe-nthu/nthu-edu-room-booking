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
      bookings: [
        {
          data: [
            {
              id: "existing-booking",
              start_time: "2026-05-20T01:30:00.000Z",
              end_time: "2026-05-20T02:30:00.000Z",
            },
          ],
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
        { data: [{ id: "new-booking", status: "pending" }], error: null },
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
          [
            expect.objectContaining({
              user_id: "user-1",
              status: "pending",
              recurrence_group_id: null,
              recurrence_frequency: null,
              recurrence_until: null,
            }),
          ],
        ],
      }),
    );
  });

  it("creates multiple pending bookings in one request", async () => {
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
        {
          data: [
            { id: "booking-1", status: "pending" },
            { id: "booking-2", status: "pending" },
          ],
          error: null,
        },
      ],
    });
    const { client: serviceClient, calls: serviceCalls } =
      createSupabaseQueryMock({
        room_approvers: [
          {
            data: [{ user_id: "approver-1", step_order: 1, label: "導師" }],
            error: null,
          },
        ],
        booking_approval_steps: [{ data: null, error: null }],
      });
    client.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    createClientMock.mockResolvedValue(client);
    createServiceClientMock.mockReturnValue(serviceClient);
    const { POST } = await import("@/app/api/bookings/route");

    const response = await POST(
      bookingRequest({
        roomId: "11111111-1111-4111-8111-111111111111",
        purpose: "運科實驗",
        recurrenceFrequency: "weekly",
        recurrenceUntil: "2026-05-27T16:00:00.000Z",
        slots: [
          {
            startTime: "2026-05-20T01:00:00.000Z",
            endTime: "2026-05-20T02:00:00.000Z",
          },
          {
            startTime: "2026-05-27T01:00:00.000Z",
            endTime: "2026-05-27T02:00:00.000Z",
          },
        ],
      }),
    );

    expect(response.status).toBe(200);
    await expect(responseJson(response)).resolves.toEqual({
      bookings: [
        { id: "booking-1", status: "pending" },
        { id: "booking-2", status: "pending" },
      ],
      createdCount: 2,
    });
    expect(calls).toContainEqual(
      expect.objectContaining({
        table: "bookings",
        method: "insert",
        args: [
          [
            expect.objectContaining({
              start_time: "2026-05-20T01:00:00.000Z",
              recurrence_frequency: "weekly",
              recurrence_until: "2026-05-27T16:00:00.000Z",
            }),
            expect.objectContaining({
              start_time: "2026-05-27T01:00:00.000Z",
              recurrence_frequency: "weekly",
              recurrence_until: "2026-05-27T16:00:00.000Z",
            }),
          ],
        ],
      }),
    );
    expect(serviceCalls).toContainEqual(
      expect.objectContaining({
        table: "booking_approval_steps",
        method: "insert",
        args: [[expect.objectContaining({ booking_id: "booking-1" })]],
      }),
    );
  });
});
