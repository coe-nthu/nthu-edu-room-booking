"use server"

import { createClient } from "@/utils/supabase/server"
import { createServiceClient } from "@/utils/supabase/service"
import { revalidatePath } from "next/cache"
import { Resend } from "resend"

export type MaintenanceRequest = {
  id: string
  user_id: string | null
  applicant_name: string
  affiliation: 'student' | 'teacher' | 'staff'
  unit: string
  phone: string
  email: string
  location: string
  occurrence_time: string | null
  description: string
  attachments: string[]
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  admin_notes: string | null
  created_at: string
  updated_at: string
  is_hidden: boolean
}

export type CreateMaintenanceRequestInput = {
  applicant_name: string
  affiliation: 'student' | 'teacher' | 'staff'
  unit: string
  phone: string
  email: string
  location: string
  occurrence_time?: string
  description: string
  attachments?: string[]
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

async function sendMaintenanceCompletedEmail(request: MaintenanceRequest) {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey || !request.email) {
    return
  }

  try {
    const resend = new Resend(resendApiKey)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const submittedAt = new Date(request.created_at).toLocaleString("zh-TW", {
      timeZone: "Asia/Taipei",
    })

    await resend.emails.send({
      from: "竹師教育學院空間借用與修繕系統 <no-reply@will-cheng.com>",
      to: request.email,
      subject: "您的報修案件已完成",
      html: `
        <h2>報修案件完成通知</h2>
        <p>${escapeHtml(request.applicant_name)} 您好：</p>
        <p>您提交的報修案件已由管理員更新為「已完成」。</p>
        <ul>
          <li><strong>報修地點：</strong>${escapeHtml(request.location)}</li>
          <li><strong>提交時間：</strong>${escapeHtml(submittedAt)}</li>
        </ul>
        ${
          request.admin_notes
            ? `<p><strong>管理員備註：</strong></p><p style="white-space: pre-wrap;">${escapeHtml(request.admin_notes)}</p>`
            : ""
        }
        <p>
          <a href="${appUrl}/dashboard/report/records" style="display: inline-block; padding: 10px 20px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">查看報修紀錄</a>
        </p>
        <hr />
        <p style="font-size: 12px; color: #666;">此信件由系統自動發送，請勿回覆。</p>
      `,
    })
  } catch (emailError) {
    console.error("Failed to send maintenance completed email:", emailError)
  }
}

// Create a new maintenance request
export async function createMaintenanceRequest(data: CreateMaintenanceRequestInput) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Use service client if not logged in to bypass RLS
  const db = user ? supabase : createServiceClient()

  const { error } = await db
    .from('maintenance_requests')
    .insert({
      user_id: user?.id || null,
      applicant_name: data.applicant_name,
      affiliation: data.affiliation,
      unit: data.unit,
      phone: data.phone,
      email: data.email,
      location: data.location,
      occurrence_time: data.occurrence_time || null,
      description: data.description,
      attachments: data.attachments || [],
    })

  if (error) {
    console.error('Error creating maintenance request:', error)
    throw new Error("提交失敗，請稍後再試")
  }

  revalidatePath('/dashboard/report')
  revalidatePath('/dashboard/admin/reports')
}

// Upload file for maintenance request
export async function uploadMaintenanceFile(formData: FormData): Promise<string> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  const file = formData.get('file') as File
  if (!file) {
    throw new Error("請選擇檔案")
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  // If no user, use 'anonymous' folder
  const folder = user?.id || 'anonymous'
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

  // Use service client if not logged in to bypass RLS
  const storageClient = user ? supabase : createServiceClient()

  const { error } = await storageClient.storage
    .from('maintenance-files')
    .upload(fileName, file)

  if (error) {
    console.error('Error uploading file:', error)
    throw new Error("檔案上傳失敗")
  }

  const { data: { publicUrl } } = storageClient.storage
    .from('maintenance-files')
    .getPublicUrl(fileName)

  return publicUrl
}

// Get all maintenance requests (admin only)
export async function getMaintenanceRequests(status?: string): Promise<MaintenanceRequest[]> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return []
  }

  let query = supabase
    .from('maintenance_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching maintenance requests:', error)
    return []
  }

  return data as MaintenanceRequest[]
}

// Get user's own maintenance requests
export async function getUserMaintenanceRequests(): Promise<MaintenanceRequest[]> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('maintenance_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user maintenance requests:', error)
    return []
  }

  return data as MaintenanceRequest[]
}

// Update maintenance request status (admin only)
export async function updateMaintenanceStatus(
  id: string, 
  status: 'pending' | 'processing' | 'completed' | 'rejected',
  adminNotes?: string,
  isHidden?: boolean
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("請先登入")
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error("權限不足")
  }

  const { data: existingRequest, error: existingError } = await supabase
    .from('maintenance_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (existingError || !existingRequest) {
    console.error('Error fetching maintenance request before update:', existingError)
    throw new Error("找不到報修案件")
  }

  const updateData: { status: string; admin_notes?: string; is_hidden?: boolean } = { status }
  if (adminNotes !== undefined) {
    updateData.admin_notes = adminNotes
  }
  if (isHidden !== undefined) {
    updateData.is_hidden = isHidden
  }

  const { data: updatedRequest, error } = await supabase
    .from('maintenance_requests')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating maintenance request:', error)
    throw new Error("更新失敗")
  }

  if (
    existingRequest.status !== 'completed' &&
    updatedRequest.status === 'completed'
  ) {
    await sendMaintenanceCompletedEmail(updatedRequest as MaintenanceRequest)
  }

  revalidatePath('/dashboard/admin/reports')
  revalidatePath('/dashboard/report/records')
}

// Get single maintenance request by ID
export async function getMaintenanceRequestById(id: string): Promise<MaintenanceRequest | null> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('maintenance_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching maintenance request:', error)
    return null
  }

  return data as MaintenanceRequest
}
