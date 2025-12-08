"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

export type Period = {
  id: string
  start: string
  end: string
}

// Fixed periods definition based on requirements
export const PERIODS = [
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
  { value: 1, label: '星期一' },
  { value: 2, label: '星期二' },
  { value: 3, label: '星期三' },
  { value: 4, label: '星期四' },
  { value: 5, label: '星期五' },
  { value: 6, label: '星期六' },
  { value: 0, label: '星期日' },
]

export type UnavailablePeriod = {
  day: number
  start: string
  end: string
}

type RoomAvailabilityTableProps = {
  value: UnavailablePeriod[]
  onChange: (value: UnavailablePeriod[]) => void
}

export function RoomAvailabilityTable({ value, onChange }: RoomAvailabilityTableProps) {
  const isSelected = (day: number, period: typeof PERIODS[0]) => {
    return value.some(
      (p) => p.day === day && p.start === period.start && p.end === period.end
    )
  }

  const handleToggle = (day: number, period: typeof PERIODS[0], checked: boolean) => {
    if (checked) {
      // Add period
      onChange([
        ...value,
        {
          day,
          start: period.start,
          end: period.end,
        },
      ])
    } else {
      // Remove period
      onChange(
        value.filter(
          (p) => !(p.day === day && p.start === period.start && p.end === period.end)
        )
      )
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm bg-background">
      <div className="grid grid-cols-[3rem_8rem_repeat(7,1fr)] bg-muted/50 text-sm font-semibold text-center border-b">
        <div className="p-3 border-r">節次</div>
        <div className="p-3 border-r">時間</div>
        {DAYS.map((day) => (
          <div key={day.value} className="p-3 border-r last:border-r-0">
            {day.label}
          </div>
        ))}
      </div>
      <div className="text-sm max-h-[500px] overflow-y-auto">
        {PERIODS.map((period, idx) => (
          <div 
            key={period.id} 
            className={cn(
              "grid grid-cols-[3rem_8rem_repeat(7,1fr)] transition-colors",
              idx % 2 === 0 ? "bg-background" : "bg-muted/20",
              "hover:bg-muted/40"
            )}
          >
            <div className="p-3 border-r border-b text-center flex items-center justify-center font-medium text-muted-foreground">
              {period.id}
            </div>
            <div className="p-3 border-r border-b text-center flex items-center justify-center text-muted-foreground text-xs">
              {period.label}
            </div>
            {DAYS.map((day) => {
              const checked = isSelected(day.value, period)
              return (
                <div
                  key={day.value}
                  className={cn(
                    "p-3 border-r last:border-r-0 border-b flex items-center justify-center transition-colors",
                    checked && "bg-destructive/10"
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(c) => handleToggle(day.value, period, c === true)}
                    className="h-5 w-5 data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
                  />
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

