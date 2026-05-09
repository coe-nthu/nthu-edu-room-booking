import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { generateTimeSlots, validateBookingRules } from "@/lib/booking-rules"
import type { Room } from "@/utils/supabase/queries"
import type { SemesterSetting } from "@/utils/semester"

const semesters: SemesterSetting[] = [
  {
    id: "spring",
    semester_name: "Spring",
    start_date: "2026-02-01",
    end_date: "2026-06-30",
    is_next_semester_open: true,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
  {
    id: "fall",
    semester_name: "Fall",
    start_date: "2026-09-01",
    end_date: "2027-01-31",
    is_next_semester_open: false,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
]

function room(overrides: Partial<Room> = {}): Room {
  return {
    id: overrides.id ?? "room-1",
    name: overrides.name ?? "Room 1",
    room_code: overrides.room_code ?? "101",
    capacity: overrides.capacity ?? 40,
    unavailable_periods: overrides.unavailable_periods ?? null,
    equipment: overrides.equipment ?? [],
    floor: overrides.floor ?? "1F",
    room_type: overrides.room_type ?? "Classroom",
    image_url: overrides.image_url ?? null,
    is_active: overrides.is_active ?? true,
    allow_noon: overrides.allow_noon ?? false,
    admin_only: overrides.admin_only ?? false,
  }
}

describe("validateBookingRules", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-05-09T09:00:00+08:00"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("rejects multi-day bookings", () => {
    const result = validateBookingRules(
      new Date("2026-05-20T23:00:00+08:00"),
      new Date("2026-05-21T01:00:00+08:00"),
      "room-1",
      [room()],
      semesters,
      false,
    )

    expect(result).toEqual({
      isValid: false,
      message: "每次預約僅能借用單日，不能跨日連續借用",
    })
  })

  it("requires regular users to book at least seven days ahead", () => {
    const result = validateBookingRules(
      new Date("2026-05-15T09:00:00+08:00"),
      new Date("2026-05-15T10:00:00+08:00"),
      "room-1",
      [room()],
      semesters,
      false,
    )

    expect(result.message).toBe("一般使用者需於 7 天前申請")
  })

  it("rejects regular-user bookings outside the four-month window", () => {
    const result = validateBookingRules(
      new Date("2026-09-10T09:00:00+08:00"),
      new Date("2026-09-10T10:00:00+08:00"),
      "room-1",
      [room()],
      semesters,
      false,
    )

    expect(result.message).toBe("一般使用者僅能借用未來 4 個月內的日期")
  })

  it("locks next-semester classroom bookings while allowing meeting rooms", () => {
    const classroomResult = validateBookingRules(
      new Date("2026-09-01T09:00:00+08:00"),
      new Date("2026-09-01T10:00:00+08:00"),
      "classroom",
      [room({ id: "classroom", room_type: "Classroom" })],
      semesters,
      false,
    )
    const meetingResult = validateBookingRules(
      new Date("2026-09-01T09:00:00+08:00"),
      new Date("2026-09-01T10:00:00+08:00"),
      "meeting",
      [room({ id: "meeting", room_type: "Meeting" })],
      semesters,
      false,
    )

    expect(classroomResult.message).toBe("下學期課表尚未確認，暫不開放預約")
    expect(meetingResult.isValid).toBe(true)
  })

  it("blocks lunch-time bookings unless the room allows noon", () => {
    const blocked = validateBookingRules(
      new Date("2026-05-20T12:30:00+08:00"),
      new Date("2026-05-20T13:30:00+08:00"),
      "room-1",
      [room({ allow_noon: false })],
      semesters,
      false,
    )
    const allowed = validateBookingRules(
      new Date("2026-05-20T12:30:00+08:00"),
      new Date("2026-05-20T13:30:00+08:00"),
      "room-1",
      [room({ allow_noon: true })],
      semesters,
      false,
    )

    expect(blocked.message).toBe("中午 12:00 - 13:00 不開放借用")
    expect(allowed.isValid).toBe(true)
  })

  it("rejects unavailable-period overlaps inside a semester", () => {
    const result = validateBookingRules(
      new Date("2026-05-20T10:30:00+08:00"),
      new Date("2026-05-20T11:30:00+08:00"),
      "room-1",
      [
        room({
          unavailable_periods: [{ day: 3, start: "10:00", end: "11:00" }],
        }),
      ],
      semesters,
      false,
    )

    expect(result).toEqual({
      isValid: false,
      message: "此空間 10:00-11:00 不開放借用",
    })
  })

  it("lets admins bypass regular-user date and lunch restrictions", () => {
    const result = validateBookingRules(
      new Date("2026-05-10T12:30:00+08:00"),
      new Date("2026-05-10T13:30:00+08:00"),
      "room-1",
      [room({ allow_noon: false })],
      semesters,
      true,
    )

    expect(result.isValid).toBe(true)
  })
})

describe("generateTimeSlots", () => {
  it("generates 30-minute slots from 08:00 through 22:00", () => {
    const slots = generateTimeSlots()

    expect(slots).toHaveLength(29)
    expect(slots[0]).toBe("08:00")
    expect(slots.at(-1)).toBe("22:00")
    expect(slots.slice(0, 4)).toEqual(["08:00", "08:30", "09:00", "09:30"])
  })
})
