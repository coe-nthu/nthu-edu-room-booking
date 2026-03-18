"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CalendarOff } from "lucide-react"
import { Room } from "@/utils/supabase/queries"
import { cn } from "@/lib/utils"

type UnavailablePeriodDialogProps = {
  room: Room
}

// Fixed periods definition
const PERIODS = [
  { id: '1', label: '08:00~08:50', start: '08:00', end: '08:50' },
  { id: '2', label: '09:00~09:50', start: '09:00', end: '09:50' },
  { id: '3', label: '10:10~11:00', start: '10:10', end: '11:00' },
  { id: '4', label: '11:10~12:00', start: '11:10', end: '12:00' },
  { id: 'n', label: '12:10~13:00', start: '12:10', end: '13:00' },
  { id: '5', label: '13:20~14:10', start: '13:20', end: '14:10' },
  { id: '6', label: '14:20~15:10', start: '14:20', end: '15:10' },
  { id: '7', label: '15:30~16:20', start: '15:30', end: '16:20' },
  { id: '8', label: '16:30~17:20', start: '16:30', end: '17:20' },
  { id: '9', label: '17:30~18:20', start: '17:30', end: '18:20' },
  { id: 'a', label: '18:30~19:20', start: '18:30', end: '19:20' },
  { id: 'b', label: '19:30~20:20', start: '19:30', end: '20:20' },
  { id: 'c', label: '20:30~21:20', start: '20:30', end: '21:20' },
  { id: 'd', label: '21:30~22:20', start: '21:30', end: '22:20' },
]

const DAYS = [
  { value: 1, label: '一' },
  { value: 2, label: '二' },
  { value: 3, label: '三' },
  { value: 4, label: '四' },
  { value: 5, label: '五' },
  { value: 6, label: '六' },
  { value: 0, label: '日' },
]

export function UnavailablePeriodDialog({ room }: UnavailablePeriodDialogProps) {
  const value = room.unavailable_periods || []

  const isSelected = (day: number, period: typeof PERIODS[0]) => {
    return value.some(
      (p) => p.day === day && p.start === period.start && p.end === period.end
    )
  }

  const hasAnyUnavailable = value.length > 0

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <CalendarOff className="mr-2 h-4 w-4" />
          查看禁止借用時段
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] md:max-w-5xl max-h-[90vh] flex flex-col p-4 md:p-6 w-full">
        <DialogHeader className="flex-none">
          <DialogTitle>{room.name} - 禁止借用時段課表</DialogTitle>
        </DialogHeader>

        {hasAnyUnavailable ? (
          <div className="flex-1 overflow-auto border rounded-xl shadow-sm mt-2">
            <div className="min-w-full">
              <div className="grid grid-cols-[3rem_5.5rem_repeat(7,1fr)] bg-muted/50 text-sm font-semibold text-center border-b sticky top-0 z-10 backdrop-blur-sm">
                <div className="p-2 border-r h-full flex items-center justify-center">節次</div>
                <div className="p-2 border-r h-full flex items-center justify-center">時間</div>
                {DAYS.map((day) => (
                  <div key={day.value} className="p-2 border-r last:border-r-0 h-full flex items-center justify-center">
                    {day.label}
                  </div>
                ))}
              </div>
              <div className="text-sm">
                {PERIODS.map((period, idx) => (
                  <div 
                    key={period.id} 
                    className={cn(
                      "grid grid-cols-[3rem_5.5rem_repeat(7,1fr)] transition-colors",
                      idx % 2 === 0 ? "bg-background" : "bg-muted/10",
                      "hover:bg-muted/30"
                    )}
                  >
                    <div className="p-1 border-r border-b text-center flex items-center justify-center font-medium text-muted-foreground">
                      {period.id}
                    </div>
                    <div className="p-1 border-r border-b text-center flex items-center justify-center text-muted-foreground text-[10px] sm:text-xs whitespace-nowrap">
                      {period.label.replace('~', ' - ')}
                    </div>
                    {DAYS.map((day) => {
                      const unavailable = isSelected(day.value, period)
                      return (
                        <div
                          key={day.value}
                          className={cn(
                            "p-1 border-r last:border-r-0 border-b flex flex-col items-center justify-center transition-colors relative min-h-[36px] sm:min-h-[44px]",
                            unavailable && "bg-destructive/10"
                          )}
                        >
                          {unavailable && (
                            <span className="text-destructive font-semibold text-[10px] sm:text-xs">
                              禁止借用
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground bg-muted/30 rounded-xl border border-dashed mt-4">
            <CalendarOff className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>此空間沒有設定固定的禁止借用時段</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
