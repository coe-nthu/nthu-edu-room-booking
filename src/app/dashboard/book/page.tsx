import { getRooms } from "@/utils/supabase/queries"
import { BookingView } from "./booking-view"

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { roomId } = await searchParams
  const rooms = await getRooms()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">預約空間</h2>
      </div>
      
      <BookingView rooms={rooms} initialRoomId={roomId as string} />
    </div>
  )
}
