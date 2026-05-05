import { createClient } from '@/utils/supabase/server'

export const ROOM_CARD_COLUMNS = `
  id,
  name,
  room_code,
  capacity,
  floor,
  room_type,
  image_url,
  is_active,
  admin_only
`

export const ROOM_DETAIL_COLUMNS = `
  id,
  name,
  room_code,
  capacity,
  unavailable_periods,
  equipment,
  floor,
  room_type,
  image_url,
  is_active,
  allow_noon,
  admin_only
`

export type Room = {
  id: string
  name: string
  room_code: string | null
  capacity: number | null
  unavailable_periods: {
    day: number
    start: string
    end: string
  }[] | null
  equipment: unknown[] | null
  floor: string | null
  room_type: string | null
  image_url: string | null
  is_active: boolean | null
  allow_noon: boolean | null
  admin_only: boolean | null
}

 
export async function getRooms(includeInactive = false): Promise<Room[]> {
  const supabase = await createClient()
  let query = supabase
    .from('rooms')
    .select(ROOM_DETAIL_COLUMNS)
    .order('name')
  
  if (!includeInactive) {
    query = query.eq('is_active', true)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching rooms:', error)
    return []
  }
  
  return data as Room[]
}

export async function getRoomCards(includeInactive = false): Promise<Room[]> {
  const supabase = await createClient()
  let query = supabase
    .from('rooms')
    .select(ROOM_CARD_COLUMNS)
    .order('name')

  if (!includeInactive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching room cards:', error)
    return []
  }

  return data as Room[]
}

export async function getRoomById(id: string): Promise<Room | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rooms')
    .select(ROOM_DETAIL_COLUMNS)
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching room:', error)
    return null
  }
  
  return data as Room
}

export type Booking = {
  id: string
  room_id?: string
  room: {
    id?: string
    name: string
    room_code: string | null
    capacity: number | null
    floor: string | null
    room_type: string | null
  }
  start_time: string
  end_time: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'cancelled_by_user'
  purpose: string
  created_at: string
  user_name?: string // Optional, for admin view
}

export type MaintenanceRecord = {
  id: string
  created_at: string
  applicant_name: string
  unit: string
  location: string
  description: string
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  admin_notes: string | null
  image_url: string | null
  is_hidden: boolean
}

export async function getMaintenanceRecords(): Promise<MaintenanceRecord[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('maintenance_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching maintenance records:', error)
    return []
  }

  return data as MaintenanceRecord[]
}

export async function getUserBookings(): Promise<Booking[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      room_id,
      start_time,
      end_time,
      status,
      purpose,
      created_at,
      room:rooms (
        id,
        name,
        room_code,
        capacity,
        floor,
        room_type
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching bookings:', error)
    return []
  }

  return data as unknown as Booking[]
}

export type TimetableEvent = {
  id: string
  title: string
  start: Date
  end: Date
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'cancelled_by_user'
  resourceId?: string
  details?: string // For admin to see extra details
}
