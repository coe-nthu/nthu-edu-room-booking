import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const bookingId = (await params).id
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify ownership and status before cancelling
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('user_id, status')
    .eq('id', bookingId)
    .single()

  if (fetchError || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  if (booking.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (booking.status !== 'pending') {
    return NextResponse.json({ error: '只能取消待審核的預約' }, { status: 400 })
  }

  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'cancelled_by_user' })
    .eq('id', bookingId)

  if (updateError) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

