import { getRooms } from "@/utils/supabase/queries"
import { SpaceList } from "./space-list"
import { createClient } from "@/utils/supabase/server"

export default async function SpacesPage() {
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

  let rooms = await getRooms()
  
  // Filter out admin_only rooms if user is not admin
  if (!isAdmin) {
    rooms = rooms.filter(room => !room.admin_only)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">空間一覽</h2>
      </div>
      
      <SpaceList initialRooms={rooms} />
    </div>
  )
}

