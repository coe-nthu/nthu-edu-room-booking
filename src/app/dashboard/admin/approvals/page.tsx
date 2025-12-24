import { getAdminBookings } from "@/utils/supabase/admin-queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminApprovalsClient } from "./admin-approvals-client"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import type { Booking as BookingListItem } from "./booking-list"

export default async function AdminApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Server-side admin check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

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

  const bookings = await getAdminBookings({
    status: status as 'pending' | 'approved' | 'rejected' | 'all',
    search: search || undefined,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">預約管理</h2>
      </div>

      <Card>
        <CardContent>
          <Suspense fallback={<div className="h-10" />}>
            <AdminApprovalsClient initialBookings={bookings as unknown as BookingListItem[]} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
