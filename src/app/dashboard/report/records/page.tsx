import { getMaintenanceRecords } from "@/utils/supabase/queries"
import { MaintenanceRecordList } from "./maintenance-record-list"
import { ClipboardList } from "lucide-react"

export default async function MaintenanceRecordsPage() {
  const records = await getMaintenanceRecords()

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-6 w-6" />
        <h2 className="text-2xl font-bold tracking-tight">報修紀錄</h2>
      </div>
      <p className="text-muted-foreground">
        Maintenance Records
      </p>

      <MaintenanceRecordList initialRecords={records} />
    </div>
  )
}

