"use server"

import { createServiceClient } from "@/utils/supabase/service"

export type DepartmentOption = {
  id: number
  name: string
}

export async function getDepartmentOptions(): Promise<DepartmentOption[]> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from("departments")
    .select("id, name")
    .order("id")

  if (error) {
    console.error("Error fetching departments:", error)
    return []
  }

  return data || []
}
