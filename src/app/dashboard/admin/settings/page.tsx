import { getSemesterSettings } from "@/app/actions/admin-settings"
import { SettingsClient } from "./settings-client"

export default async function AdminSettingsPage() {
  const semesters = await getSemesterSettings()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">系統設定</h2>
      </div>
      <SettingsClient initialSemesters={semesters} />
    </div>
  )
}

