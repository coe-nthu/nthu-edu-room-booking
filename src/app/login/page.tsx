import LoginClient from "./login-client"
import { createServiceClient } from "@/utils/supabase/service"

export default async function LoginPage() {
  const supabaseAdmin = createServiceClient()
  const { data: departments } = await supabaseAdmin.from('departments').select('id, name').order('id')
  
  return <LoginClient initialDepartments={departments || []} />
}
