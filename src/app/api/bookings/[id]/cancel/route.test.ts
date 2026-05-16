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

async function cancelBooking(id = "booking-1") {
  const { POST } = await import("@/app/api/bookings/[id]/cancel/route");

  return POST(new Request(`https://example.com/api/bookings/${id}/cancel`), {
    params: Promise.resolve({ id }),
  });
}

async function responseJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

describe("POST /api/bookings/[id]/cancel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-16T09:00:00.000Z"));
    createClientMock.mockReset();
    createServiceClientMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows owners to cancel future approved bookings", async () => {
    const { client } = createSupabaseQueryMock({
      bookings: [
        {
          data: {
            user_id: "user-1",
            status: "approved",
            start_time: "2026-05-20T09:00:00.000Z",
          },
          error: null,
        },
        { data: null, error: null },
      ],
    });
    const { client: serviceClient, calls: serviceCalls } =
      createSupabaseQueryMock({
        booking_approval_steps: [{ data: null, error: null }],
      });
    client.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    createClientMock.mockResolvedValue(client);
    createServiceClientMock.mockReturnValue(serviceClient);

    const response = await cancelBooking();

    expect(response.status).toBe(200);
    await expect(responseJson(response)).resolves.toEqual({ success: true });
    expect(serviceCalls).toContainEqual(
      expect.objectContaining({
        table: "bookings",
        method: "update",
        args: [{ status: "cancelled_by_user" }],
      }),
    );
    expect(serviceCalls).toContainEqual(
      expect.objectContaining({
        table: "booking_approval_steps",
        method: "update",
        args: [
          expect.objectContaining({
            status: "skipped",
            comment: "使用者取消預約",
          }),
        ],
      }),
    );
  });

  it("rejects bookings that have already started", async () => {
    const { client } = createSupabaseQueryMock({
      bookings: [
        {
          data: {
            user_id: "user-1",
            status: "approved",
            start_time: "2026-05-10T09:00:00.000Z",
          },
          error: null,
        },
      ],
    });
    client.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    createClientMock.mockResolvedValue(client);

    const response = await cancelBooking();

    expect(response.status).toBe(400);
    await expect(responseJson(response)).resolves.toEqual({
      error: "只能取消尚未開始的待審核或已核准預約",
    });
    expect(createServiceClientMock).not.toHaveBeenCalled();
  });
});
