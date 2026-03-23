import { getAdminBookings } from "@/utils/supabase/admin-queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminApprovalsClient } from "./admin-approvals-client"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import type { Booking as BookingListItem } from "./booking-list"
import { Loader2 } from "lucide-react"

async function BookingsLoader({ status, search }: { status: string, search: string }) {
  const bookings = await getAdminBookings({
    status: status as 'pending' | 'approved' | 'rejected' | 'all',
    search: search || undefined,
  })

  return <AdminApprovalsClient initialBookings={bookings as unknown as BookingListItem[]} />
}

export default async function AdminApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Server-side admin check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Auth check is fast, we await it before streaming the UI boundary
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const params = await searchParams
  const status = (params.status as string) || 'all'
  const search = (params.search as string) || ''

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">預約管理</h2>
      </div>

      <Card>
        <CardContent>
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
              <p>載入預約資料中...</p>
            </div>
          }>
            <BookingsLoader status={status} search={search} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
