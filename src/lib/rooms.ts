import type { Room } from "@/utils/supabase/queries"

function getFloorSortValue(floor: string | null | undefined) {
  const normalizedFloor = floor?.trim().toUpperCase()

  if (!normalizedFloor) {
    return Number.POSITIVE_INFINITY
  }

  const basementMatch = normalizedFloor.match(/^B(\d+)F?$/)
  if (basementMatch) {
    return -Number(basementMatch[1])
  }

  const floorMatch = normalizedFloor.match(/^(\d+)F?$/)
  if (floorMatch) {
    return Number(floorMatch[1])
  }

  return Number.POSITIVE_INFINITY
}

export function compareFloors(
  floorA: string | null | undefined,
  floorB: string | null | undefined,
) {
  const floorDiff = getFloorSortValue(floorA) - getFloorSortValue(floorB)

  if (floorDiff !== 0) {
    return floorDiff
  }

  return String(floorA ?? "").localeCompare(String(floorB ?? ""), undefined, {
    numeric: true,
  })
}

export function compareRoomsByFloor(a: Room, b: Room) {
  const floorDiff = compareFloors(a.floor, b.floor)

  if (floorDiff !== 0) {
    return floorDiff
  }

  const codeDiff = String(a.room_code ?? "").localeCompare(
    String(b.room_code ?? ""),
    undefined,
    { numeric: true },
  )

  if (codeDiff !== 0) {
    return codeDiff
  }

  return a.name.localeCompare(b.name, undefined, { numeric: true })
}
