import { redirect } from "next/navigation"

import { getAdminDocumentDownloadContent } from "@/app/actions/document-downloads"
import { createClient } from "@/utils/supabase/server"
import { DocumentDownloadsClient } from "./document-downloads-client"

export default async function AdminDocumentDownloadsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  const content = await getAdminDocumentDownloadContent()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">文件下載設定</h2>
        <p className="text-sm text-muted-foreground">
          編輯公開文件下載頁面的說明文字，並管理訪客也能下載的檔案。
        </p>
      </div>
      <DocumentDownloadsClient initialContent={content} />
    </div>
  )
}
