import { getRooms } from "@/utils/supabase/queries"
import { SpaceList } from "./space-list"

export default async function SpacesPage() {
  const rooms = await getRooms()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">空間一覽</h2>
      </div>
      
      <SpaceList initialRooms={rooms} />
    </div>
  )
}

