import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const publicPaths = [
  "/login",
  "/auth",
  "/reset-password",
  "/dashboard/spaces",
  "/dashboard/rules",
  "/dashboard/downloads",
  "/dashboard/report",
  "/dashboard/report/records",
];

export async function updateSession(request: NextRequest) {
  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (isPublicPath || request.nextUrl.pathname === "/") {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is not logged in and trying to access a protected route
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    let isApproved = false;
    let isAdmin = false;
    let statusSource = "none";

    const cachedStatus = request.cookies.get("user_auth_status")?.value;
    if (cachedStatus) {
      try {
        const parsed = JSON.parse(cachedStatus);
        if (parsed.userId === user.id) {
          isApproved = parsed.isApproved;
          isAdmin = parsed.isAdmin;
          statusSource = "cookie";
        }
      } catch (e) {
        console.error("Cookie parse error", e);
      }
    }

    if (statusSource === "none") {
      // Fetch profile to check approval status and role if not cached
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("is_approved, role")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Middleware profile fetch error:", error);
      }

      isAdmin = profile?.role === "admin";
      isApproved = isAdmin || (profile?.is_approved ?? false);

      // Cache this status in cookie for 5 minutes to avoid DB hit on every request
      supabaseResponse.cookies.set(
        "user_auth_status",
        JSON.stringify({ userId: user.id, isApproved, isAdmin }),
        {
          maxAge: 300,
          httpOnly: true,
          sameSite: "lax",
          path: "/",
        },
      );
    }

    const isPendingPage = request.nextUrl.pathname === "/approval-pending";

    // Debug logging (remove in production if needed)
    // console.log(`Middleware Check: User ${user.email}, Role: ${profile?.role}, Approved: ${profile?.is_approved}, isAdmin: ${isAdmin}`)

    // If not approved and trying to access protected pages, redirect to pending page
    if (!isApproved && !isPendingPage) {
      return NextResponse.redirect(new URL("/approval-pending", request.url));
    }

    // If approved but trying to access pending page, redirect to dashboard
    if (isApproved && isPendingPage) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return supabaseResponse;
}
