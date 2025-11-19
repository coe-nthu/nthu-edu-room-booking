import { getPendingBookings } from "@/utils/supabase/admin-queries"
import { format } from "date-fns"
import { zhTW } from "date-fns/locale"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ActionButtons } from "./action-buttons"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export default async function AdminApprovalsPage() {
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

  const bookings = await getPendingBookings()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">預約審核</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>待審核列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>申請人</TableHead>
                <TableHead>單位/系所</TableHead>
                <TableHead>空間</TableHead>
                <TableHead>時間</TableHead>
                <TableHead>事由</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                    目前沒有待審核的預約
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="font-medium">{booking.user.full_name}</div>
                      <div className="text-xs text-muted-foreground">{booking.user.student_id}</div>
                    </TableCell>
                    <TableCell>{booking.user.department?.name || '-'}</TableCell>
                    <TableCell>{booking.room.name}</TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {format(new Date(booking.start_time), "MM/dd", { locale: zhTW })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(booking.start_time), "HH:mm")} - {format(new Date(booking.end_time), "HH:mm")}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={booking.purpose}>
                      {booking.purpose}
                    </TableCell>
                    <TableCell className="text-right">
                      <ActionButtons bookingId={booking.id} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

