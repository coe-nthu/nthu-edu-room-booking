import { getRooms } from "@/utils/supabase/queries"
import { BookingView } from "./booking-view"
import { createClient } from "@/utils/supabase/server"

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { roomId } = await searchParams
  let rooms = await getRooms()

  const supabase = await createClient()
  // Check if user is admin
  let isAdmin = false
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role === 'admin') {
      isAdmin = true
    }
  }

  if (!isAdmin) {
    rooms = rooms.filter(room => !room.admin_only)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">預約空間</h2>
      </div>
      
      <BookingView rooms={rooms} initialRoomId={roomId as string} />
    </div>
  )
}
