import { cookies } from "next/headers"
import { getRoomCards } from "@/utils/supabase/queries"
import { SpaceList } from "./space-list"
import { createClient } from "@/utils/supabase/server"
import { hasSupabaseAuthCookie } from "@/utils/supabase/auth-cookies"

export default async function SpacesPage() {
  const cookieStore = await cookies()
  const shouldCheckUser = hasSupabaseAuthCookie(cookieStore)

  const [roomsData, userResult] = await Promise.all([
    getRoomCards(),
    shouldCheckUser
      ? createClient().then((supabase) => supabase.auth.getUser())
      : Promise.resolve(null),
  ])
  
  let rooms = roomsData
  let isAdmin = false
  const user = userResult?.data.user

  if (user) {
    const supabase = await createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role === 'admin') {
      isAdmin = true
    }
  }
  
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
