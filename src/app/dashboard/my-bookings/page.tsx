import { getUserBookings, getRooms } from "@/utils/supabase/queries"
import { getSemesterSettings } from "@/app/actions/admin-settings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookingList } from "./booking-list"
import { createClient } from "@/utils/supabase/server"

export default async function MyBookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.role === 'admin'
  }

  const bookings = await getUserBookings()
  let rooms = await getRooms()
  const semesterSettings = await getSemesterSettings()

  if (!isAdmin) {
    rooms = rooms.filter(room => !room.admin_only)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">我的預約紀錄</h2>
      </div>

      <Card>
        <CardContent>
          <BookingList 
            bookings={bookings} 
            rooms={rooms} 
            semesterSettings={semesterSettings || []} 
          />
        </CardContent>
      </Card>
    </div>
  )
}
