import { getRooms } from "@/utils/supabase/queries"
import { AdminRoomsClient } from "./admin-rooms-client"

export default async function AdminRoomsPage() {
  // Admin should see all rooms including inactive ones
  const rooms = await getRooms(true)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">空間管理</h2>
      </div>
      <AdminRoomsClient initialRooms={rooms} />
    </div>
  )
}
