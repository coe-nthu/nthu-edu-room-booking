"use server"

import { createClient } from "@/utils/supabase/server"
import { createServiceClient } from "@/utils/supabase/service"
import { revalidatePath } from "next/cache"

// Ensure current user is admin
async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error("Unauthorized")

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') throw new Error("Forbidden")
  return supabase
}

export async function deleteBooking(bookingId: string) {
  await requireAdmin()
  const supabaseAdmin = createServiceClient()

  const { error } = await supabaseAdmin
    .from('bookings')
    .delete()
    .eq('id', bookingId)

  if (error) {
    throw error
  }

  revalidatePath('/dashboard/admin/approvals')
}

