import { getAdminBookings } from "@/utils/supabase/admin-queries";
import { Card, CardContent } from "@/components/ui/card";
import { AdminApprovalsClient } from "./admin-approvals-client";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import type { Booking as BookingListItem } from "./booking-list";
import { Loader2 } from "lucide-react";

async function BookingsLoader({
  status,
  search,
  includeHistory,
  page,
  pageSize,
}: {
  status: string;
  search: string;
  includeHistory: boolean;
  page: number;
  pageSize: number;
}) {
  const result = await getAdminBookings({
    status: status as "pending" | "approved" | "rejected" | "all",
    search: search || undefined,
    includeHistory,
    page,
    pageSize,
  });

  return (
    <AdminApprovalsClient
      initialBookings={result.bookings as unknown as BookingListItem[]}
      totalCount={result.totalCount}
      page={result.page}
      pageSize={result.pageSize}
      totalPages={result.totalPages}
      showHistory={includeHistory}
    />
  );
}

export default async function AdminApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Server-side admin check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Auth check is fast, we await it before streaming the UI boundary
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const status = (params.status as string) || "pending";
  const search = (params.search as string) || "";
  const includeHistory = params.history === "1";
  const page = Number(params.page) || 1;
  const pageSize = Number(params.pageSize) || 50;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">預約管理</h2>
      </div>

      <Card className="border-none shadow-none md:border md:shadow-sm">
        <CardContent className="p-0 md:p-3">
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                <p>載入預約資料中...</p>
              </div>
            }
          >
            <BookingsLoader
              status={status}
              search={search}
              includeHistory={includeHistory}
              page={page}
              pageSize={pageSize}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
