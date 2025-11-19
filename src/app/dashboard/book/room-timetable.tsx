"use client"

import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useEffect, useState, useCallback } from 'react'
import { TimetableEvent } from '@/utils/supabase/queries'
import { getRoomBookings } from '@/app/actions/bookings'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const locales = {
  'zh-TW': zhTW,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

type RoomTimetableProps = {
  roomId: string
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void
}

export function RoomTimetable({ roomId, onSelectSlot }: RoomTimetableProps) {
  const [events, setEvents] = useState<TimetableEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<View>(Views.WEEK)
  const [date, setDate] = useState(new Date())

  const fetchEvents = useCallback(async () => {
    if (!roomId) return
    setLoading(true)
    try {
      const data = await getRoomBookings(roomId)
      setEvents(data)
    } catch (error) {
      console.error('Failed to fetch events', error)
    } finally {
      setLoading(false)
    }
  }, [roomId])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const eventStyleGetter = (event: TimetableEvent) => {
    let backgroundColor = '#3174ad'
    if (event.status === 'approved') {
      backgroundColor = '#ef4444' // Red-500
    } else if (event.status === 'pending') {
      backgroundColor = '#f97316' // Orange-500
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    }
  }

  return (
    <div className="h-[600px] relative bg-background rounded-lg border p-4 shadow-sm">
      {loading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        views={['month', 'week', 'day']}
        view={view}
        date={date}
        onNavigate={setDate}
        onView={setView}
        eventPropGetter={eventStyleGetter}
        selectable
        onSelectSlot={(slotInfo) => {
            // Only allow selection in future
            if (slotInfo.start >= new Date()) {
                onSelectSlot?.(slotInfo)
            }
        }}
        culture="zh-TW"
        messages={{
            next: "下一個",
            previous: "上一個",
            today: "今天",
            month: "月",
            week: "週",
            day: "日",
            agenda: "議程",
            date: "日期",
            time: "時間",
            event: "事件",
            noEventsInRange: "此時段無預約",
        }}
        min={new Date(0, 0, 0, 8, 0, 0)} // Start at 8:00 AM
        max={new Date(0, 0, 0, 22, 0, 0)} // End at 10:00 PM
      />
    </div>
  )
}
