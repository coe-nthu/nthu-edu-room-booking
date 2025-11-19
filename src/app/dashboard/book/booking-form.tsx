"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { zhTW } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { Room } from "@/utils/supabase/queries"
import { useEffect, useState } from "react"

const bookingFormSchema = z.object({
  roomId: z.string({
    message: "請選擇空間",
  }),
  date: z.date({
    message: "請選擇日期",
  }),
  startTime: z.string({
    message: "請選擇開始時間",
  }),
  endTime: z.string({
    message: "請選擇結束時間",
  }),
  purpose: z.string().min(5, {
    message: "事由至少需要 5 個字",
  }),
}).refine((data) => {
  return data.endTime > data.startTime
}, {
  message: "結束時間必須晚於開始時間",
  path: ["endTime"],
})

type BookingFormProps = {
  rooms: Room[]
}

export function BookingForm({ rooms }: BookingFormProps) {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  
  const form = useForm<z.infer<typeof bookingFormSchema>>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      purpose: "",
    },
  })

  useEffect(() => {
    const checkUserRole = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        if (profile?.role === 'admin') {
          setIsAdmin(true)
        }
      }
    }
    checkUserRole()
  }, [])

  async function onSubmit(values: z.infer<typeof bookingFormSchema>) {
    const supabase = createClient()
    
    const startDateTime = new Date(values.date)
    const [startHour, startMinute] = values.startTime.split(':').map(Number)
    startDateTime.setHours(startHour, startMinute, 0, 0)
    
    const endDateTime = new Date(values.date)
    const [endHour, endMinute] = values.endTime.split(':').map(Number)
    endDateTime.setHours(endHour, endMinute, 0, 0)

    // 1. Check user role for 7-day rule (Client-side pre-check)
    // We can use the state isAdmin directly here as fallback, or recheck to be safe
    // Rechecking to be consistent with original logic but we can optimize later
    
    if (!isAdmin) {
      const today = new Date()
      const minDate = new Date()
      minDate.setDate(today.getDate() + 7)
      minDate.setHours(0, 0, 0, 0)
      
      if (startDateTime < minDate) {
        toast.error("一般使用者需於 7 天前申請")
        return
      }
    }

    // Rule: Unavailable periods check
    const selectedRoom = rooms.find(r => r.id === values.roomId)
    if (selectedRoom?.unavailable_periods && Array.isArray(selectedRoom.unavailable_periods)) {
      const bookingDay = startDateTime.getDay()
      const requestStartMins = startHour * 60 + startMinute
      const requestEndMins = endHour * 60 + endMinute

      for (const period of selectedRoom.unavailable_periods) {
        if (period.day === bookingDay) {
           const [pStartH, pStartM] = period.start.split(':').map(Number)
           const [pEndH, pEndM] = period.end.split(':').map(Number)
           const periodStartMins = pStartH * 60 + pStartM
           const periodEndMins = pEndH * 60 + pEndM

           if (Math.max(requestStartMins, periodStartMins) < Math.min(requestEndMins, periodEndMins)) {
             toast.error(`此空間 ${period.start}-${period.end} 不開放借用`)
             return
           }
        }
      }
    }

    try {
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                roomId: values.roomId,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                purpose: values.purpose,
            }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || '預約失敗')
        }

        toast.success("預約申請已送出")
        form.reset()
        router.push('/dashboard/my-bookings')
    } catch (error: any) {
        toast.error(error.message)
    }
  }

  const timeSlots = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 8
    return `${hour.toString().padStart(2, '0')}:00`
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="roomId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>選擇空間</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="請選擇借用空間" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                       {room.room_code} - {room.name} {room.capacity && `(${room.capacity}人)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {rooms.find(r => r.id === field.value)?.room_code} {rooms.find(r => r.id === field.value)?.room_type && `(${rooms.find(r => r.id === field.value)?.room_type})`}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>日期</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: zhTW })
                      ) : (
                        <span>選擇日期</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => {
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      
                      // Always disable past dates
                      if (date < today) return true

                      // If user is NOT admin, disable dates within the next 7 days
                      if (!isAdmin) {
                         const minDate = new Date(today)
                         minDate.setDate(today.getDate() + 7)
                         return date < minDate
                      }
                      
                      return false
                    }}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>開始時間</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="開始" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>結束時間</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="結束" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="purpose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>借用事由</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="請簡述借用目的、活動內容..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">提交申請</Button>
      </form>
    </Form>
  )
}
