"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search } from "lucide-react"
import { useDebouncedCallback } from "use-debounce"

export function ApprovalToolbar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentStatus = searchParams.get('status') || 'all'
  const currentSearch = searchParams.get('search') || ''

  const updateSearchParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/dashboard/admin/approvals?${params.toString()}`)
  }

  const debouncedSearch = useDebouncedCallback((value: string) => {
    updateSearchParams('search', value)
  }, 300)

  const handleStatusChange = (value: string) => {
    updateSearchParams('status', value)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜尋申請人、學號、空間名稱或代碼..."
          defaultValue={currentSearch}
          onChange={(e) => debouncedSearch(e.target.value)}
          className="pl-8"
        />
      </div>
      <div className="w-full sm:w-[200px]">
        <Select value={currentStatus} onValueChange={handleStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="篩選狀態" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部狀態</SelectItem>
            <SelectItem value="pending">待審核</SelectItem>
            <SelectItem value="approved">已核准</SelectItem>
            <SelectItem value="rejected">已拒絕</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

