import { createClient } from '@/utils/supabase/server'
import type { Booking } from './queries'

export type AdminBooking = Booking & {
  user: {
    full_name: string
    email: string
    student_id: string | null
    department: {
      name: string
    } | null
  }
}

export async function getPendingBookings(): Promise<AdminBooking[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      start_time,
      end_time,
      status,
      purpose,
      created_at,
      room:rooms (
        name
      ),
      user:profiles (
        full_name,
        student_id,
        username, 
        department:departments (
           name
        )
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true }) // Oldest first

  if (error) {
    console.error('Error fetching pending bookings:', error)
    return []
  }

  // Map username to email if needed, or handle in component. 
  // profiles table has 'username' which might be email or custom.
  // In initial schema, we didn't explicitly store email in profiles, but auth.users has it.
  // For now let's use username or full_name.
  
  return data as unknown as AdminBooking[]
}

