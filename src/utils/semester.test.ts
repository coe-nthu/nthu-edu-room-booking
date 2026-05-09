import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  checkDateRestrictions,
  getCurrentSemester,
  getNextSemester,
  isDateInLockedPeriod,
  isDateInSemester,
  isDateWithin4Months,
  isSameDay,
  type SemesterSetting,
} from "@/utils/semester"

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

describe("semester utilities", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-05-09T09:00:00+08:00"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("checks whether two dates are on the same local day", () => {
    expect(
      isSameDay(
        new Date("2026-05-09T08:00:00+08:00"),
        new Date("2026-05-09T22:00:00+08:00"),
      ),
    ).toBe(true)
    expect(
      isSameDay(
        new Date("2026-05-09T23:30:00+08:00"),
        new Date("2026-05-10T00:30:00+08:00"),
      ),
    ).toBe(false)
  })

  it("detects dates inside semester ranges", () => {
    expect(isDateInSemester(new Date("2026-02-01T12:00:00+08:00"), semesters[0])).toBe(true)
    expect(isDateInSemester(new Date("2026-06-30T23:00:00+08:00"), semesters[0])).toBe(true)
    expect(isDateInSemester(new Date("2026-07-01T00:00:00+08:00"), semesters[0])).toBe(false)
  })

  it("finds current and next semester from today's date", () => {
    const current = getCurrentSemester(semesters)
    expect(current?.id).toBe("spring")
    expect(getNextSemester(semesters, current)?.id).toBe("fall")
  })

  it("enforces the four-month booking window for regular users", () => {
    expect(isDateWithin4Months(new Date("2026-09-09T08:00:00+08:00"))).toBe(true)
    expect(isDateWithin4Months(new Date("2026-09-10T08:00:00+08:00"))).toBe(false)
  })

  it("locks next semester for non-admins and bypasses for admins", () => {
    const fallDate = new Date("2026-09-15T08:00:00+08:00")

    expect(isDateInLockedPeriod(fallDate, semesters, false)).toBe(true)
    expect(isDateInLockedPeriod(fallDate, semesters, true)).toBe(false)
  })

  it("reports the first matching restriction", () => {
    expect(checkDateRestrictions(new Date("2026-09-10T08:00:00+08:00"), semesters, false)).toEqual({
      isRestricted: true,
      message: "一般使用者僅能借用未來 4 個月內的日期",
    })
    expect(checkDateRestrictions(new Date("2026-09-15T08:00:00+08:00"), semesters, true)).toEqual({
      isRestricted: false,
      message: null,
    })
  })
})
