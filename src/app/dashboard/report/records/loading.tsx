import { Skeleton } from "@/components/ui/skeleton"
import { ClipboardList } from "lucide-react"

export default function MaintenanceRecordsLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-6 w-6" />
        <h2 className="text-2xl font-bold tracking-tight">報修紀錄</h2>
      </div>
      <p className="text-muted-foreground">
        Maintenance Records
      </p>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
