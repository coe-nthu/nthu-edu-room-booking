"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import type { SemesterSetting } from "@/utils/semester"

// Ensure current user is admin
async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error("Unauthorized")

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') throw new Error("Forbidden")
  return user
}

/**
 * Get all semester settings
 */
export async function getSemesterSettings(): Promise<SemesterSetting[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('semester_settings')
    .select('*')
    .order('start_date', { ascending: true })
  
  if (error) {
    console.error('Error fetching semester settings:', error)
    throw error
  }
  
  return data || []
}

/**
 * Update a semester setting (admin only)
 */
export async function updateSemesterSettings(
  id: string,
  updates: {
    semester_name?: string
    start_date?: string
    end_date?: string
    is_next_semester_open?: boolean
  }
) {
  await requireAdmin()
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('semester_settings')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
  
  if (error) {
    console.error('Error updating semester settings:', error)
    throw error
  }
  
  revalidatePath('/dashboard/admin/settings')
  revalidatePath('/dashboard/spaces')
}

/**
 * Toggle next semester open status (admin only)
 */
export async function toggleNextSemesterOpen(id: string, isOpen: boolean) {
  await requireAdmin()
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('semester_settings')
    .update({
      is_next_semester_open: isOpen,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
  
  if (error) {
    console.error('Error toggling next semester open:', error)
    throw error
  }
  
  revalidatePath('/dashboard/admin/settings')
  revalidatePath('/dashboard/spaces')
}

/**
 * Create a new semester setting (admin only)
 */
export async function createSemesterSetting(data: {
  semester_name: string
  start_date: string
  end_date: string
  is_next_semester_open?: boolean
}) {
  await requireAdmin()
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('semester_settings')
    .insert({
      semester_name: data.semester_name,
      start_date: data.start_date,
      end_date: data.end_date,
      is_next_semester_open: data.is_next_semester_open || false
    })
  
  if (error) {
    console.error('Error creating semester setting:', error)
    throw error
  }
  
  revalidatePath('/dashboard/admin/settings')
}

/**
 * Delete a semester setting (admin only)
 */
export async function deleteSemesterSetting(id: string) {
  await requireAdmin()
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('semester_settings')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting semester setting:', error)
    throw error
  }
  
  revalidatePath('/dashboard/admin/settings')
}
