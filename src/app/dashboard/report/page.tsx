import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { createServiceClient } from "@/utils/supabase/service"
import { hasSupabaseAuthCookie } from "@/utils/supabase/auth-cookies"
import { ReportForm } from "./report-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

type ReportDefaultValues = {
  applicant_name: string
  affiliation?: "student" | "teacher" | "staff"
  email: string
  phone: string
  unit: string
}

function normalizeAffiliation(userType: string | null | undefined): ReportDefaultValues["affiliation"] {
  if (userType === "student" || userType === "teacher" || userType === "staff") {
    return userType
  }

  if (userType === "assistant") {
    return "staff"
  }

  return undefined
}

export default async function ReportPage() {
  const cookieStore = await cookies()
  const shouldCheckUser = hasSupabaseAuthCookie(cookieStore)

  let defaultValues: ReportDefaultValues = {
    applicant_name: "",
    email: "",
    phone: "",
    unit: "",
  }

  // Pre-fill user info if logged in
  if (shouldCheckUser) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const supabaseAdmin = createServiceClient()
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name, phone, user_type, department_id')
        .eq('id', user.id)
        .single()

      if (profile) {
        let unit = ""

        if (profile.department_id) {
          const { data: department } = await supabaseAdmin
            .from('departments')
            .select('name')
            .eq('id', profile.department_id)
            .single()

          unit = department?.name || ""
        }

        defaultValues = {
          applicant_name: profile.full_name || "",
          affiliation: normalizeAffiliation(profile.user_type),
          email: user.email || "",
          phone: profile.phone || "",
          unit,
        }
      } else {
        defaultValues.email = user.email || ""
      }
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">報修系統 / 施工申請</h2>
        <p className="text-muted-foreground">
          Request Form for Issue Report / Construction Application
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            竹師教育學院大樓報修系統/施工申請單
          </CardTitle>
          <CardDescription className="space-y-4 pt-2">
            <p>
              為維護大樓空間品質與師生使用安全，若遇到教室、環境或設施相關問題或需要維修改善之處，再請填寫表單，我們收到後會轉交相關單位盡速處理。
            </p>
            <p className="text-sm text-muted-foreground">
              To maintain building quality and ensure the safety of faculty and students, please report any classroom, facility, or environmental issues through the designated form for prompt handling.
            </p>
            <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 mt-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>注意：</strong>若提出施工申請，需經院本部評估審核通過後才可以進行施作。
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                All construction or renovation requests must be reviewed and approved by the College before proceeding.
              </p>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportForm defaultValues={defaultValues} />
        </CardContent>
      </Card>
    </div>
  )
}
