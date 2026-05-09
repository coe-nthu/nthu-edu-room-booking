import { describe, expect, it } from "vitest";

import { hasSupabaseAuthCookie } from "@/utils/supabase/auth-cookies";

describe("hasSupabaseAuthCookie", () => {
  it("detects Supabase auth-token cookies", () => {
    expect(
      hasSupabaseAuthCookie({
        getAll: () => [{ name: "sb-project-auth-token" }],
      }),
    ).toBe(true);
  });

  it("ignores unrelated Supabase and app cookies", () => {
    expect(
      hasSupabaseAuthCookie({
        getAll: () => [
          { name: "sb-project-code-verifier" },
          { name: "user_auth_status" },
        ],
      }),
    ).toBe(false);
  });
});
