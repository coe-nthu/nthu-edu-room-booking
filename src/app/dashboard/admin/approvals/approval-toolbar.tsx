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
import { Search, RefreshCw } from "lucide-react"
import { useDebouncedCallback } from "use-debounce"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface ApprovalToolbarProps {
  showHistory: boolean
  onShowHistoryChange: (value: boolean) => void
}

export function ApprovalToolbar({ showHistory, onShowHistoryChange }: ApprovalToolbarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isRefreshing, setIsRefreshing] = useState(false)
  
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

  const handleRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    // 重置 loading 狀態（refresh 是異步的，但我們可以設定一個短暫的延遲）
    setTimeout(() => {
      setIsRefreshing(false)
    }, 500)
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
      <div className="relative w-full sm:w-[400px]">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜尋申請人、空間名稱或編號..."
          defaultValue={currentSearch}
          onChange={(e) => debouncedSearch(e.target.value)}
          className="pl-8"
        />
      </div>
      
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="bg-white hover:bg-gray-50 border-gray-300"
        >
          <RefreshCw 
            className={`h-4 w-4 text-gray-700 ${isRefreshing ? 'animate-spin' : ''}`} 
          />
        </Button>
        <div className="w-full">
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
        <div className="flex items-center space-x-2">
          <Switch
            id="show-history"
            checked={showHistory}
            onCheckedChange={onShowHistoryChange}
          />
          <Label htmlFor="show-history" className="text-sm whitespace-nowrap">顯示歷史紀錄</Label>
        </div>
      </div>
    </div>
  )
}

