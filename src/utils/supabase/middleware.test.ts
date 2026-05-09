import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { createServerClientMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock,
}));

function request(path: string, cookie?: string) {
  return new NextRequest(`https://example.com${path}`, {
    headers: cookie ? { cookie } : undefined,
  });
}

describe("updateSession", () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
  });

  it("lets public routes through without creating a Supabase client", async () => {
    const { updateSession } = await import("@/utils/supabase/middleware");

    const response = await updateSession(request("/dashboard/spaces"));

    expect(response.status).toBe(200);
    expect(createServerClientMock).not.toHaveBeenCalled();
  });

  it("redirects protected routes when there is no user", async () => {
    createServerClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    });
    const { updateSession } = await import("@/utils/supabase/middleware");

    const response = await updateSession(request("/dashboard"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.com/login");
  });

  it("uses cached auth status instead of querying the profile", async () => {
    const fromMock = vi.fn();
    createServerClientMock.mockReturnValue({
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
      from: fromMock,
    });
    const cachedStatus = encodeURIComponent(
      JSON.stringify({ userId: "user-1", isApproved: true, isAdmin: false }),
    );
    const { updateSession } = await import("@/utils/supabase/middleware");

    const response = await updateSession(
      request("/dashboard", `user_auth_status=${cachedStatus}`),
    );

    expect(response.status).toBe(200);
    expect(fromMock).not.toHaveBeenCalled();
  });
});
