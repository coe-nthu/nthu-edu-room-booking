import { cookies } from "next/headers"
import { ROOM_DETAIL_COLUMNS } from "@/utils/supabase/queries"
import { notFound } from "next/navigation"
import { SpaceBookingClient } from "./space-booking-client"
import { createClient } from "@/utils/supabase/server"
import type { SemesterSetting } from "@/utils/semester"
import { hasSupabaseAuthCookie } from "@/utils/supabase/auth-cookies"

export default async function SpaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = await createClient()
  const shouldCheckUser = hasSupabaseAuthCookie(cookieStore)

  const [roomResult, semesterResult, userResult] = await Promise.all([
    supabase
      .from('rooms')
      .select(ROOM_DETAIL_COLUMNS)
      .eq('id', id)
      .single(),
    supabase
      .from('semester_settings')
      .select('id, semester_name, start_date, end_date, is_next_semester_open, created_at, updated_at')
      .order('start_date', { ascending: true }),
    shouldCheckUser ? supabase.auth.getUser() : Promise.resolve(null),
  ])

  const room = roomResult.data

  if (!room || roomResult.error) {
    notFound()
  }
  
  const semesters: SemesterSetting[] = semesterResult.data as SemesterSetting[] || []

  // Check if user is admin
  let isAdmin = false
  const user = userResult?.data.user
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

  // Redirect if room is inactive and user is not admin
  if (room.is_active === false && !isAdmin) {
    notFound()
  }

  // Redirect if room is admin only and user is not admin
  if (room.admin_only && !isAdmin) {
    notFound()
  }

  return (
    <SpaceBookingClient 
      room={room} 
      semesters={semesters} 
      isAdmin={isAdmin} 
    />
  )
}
