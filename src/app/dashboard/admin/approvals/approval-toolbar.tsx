"use client";

import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, RefreshCw } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ApprovalToolbarProps {
  showHistory: boolean;
  isLoading: boolean;
  onRefresh: () => void;
  onSearchParamsChange: (updates: Record<string, string | null>) => void;
  onShowHistoryChange: (value: boolean) => void;
}

export function ApprovalToolbar({
  showHistory,
  isLoading,
  onRefresh,
  onSearchParamsChange,
  onShowHistoryChange,
}: ApprovalToolbarProps) {
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") || "pending";
  const currentSearch = searchParams.get("search") || "";

  const debouncedSearch = useDebouncedCallback((value: string) => {
    onSearchParamsChange({
      search: value || null,
      page: null,
    });
  }, 300);

  const handleStatusChange = (value: string) => {
    onSearchParamsChange({
      status: value === "pending" ? null : value,
      page: null,
    });
  };

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
          onClick={onRefresh}
          disabled={isLoading}
          className="bg-white hover:bg-gray-50 border-gray-300"
          aria-label="重新整理預約資料"
        >
          <RefreshCw
            className={`h-4 w-4 text-gray-700 ${isLoading ? "animate-spin" : ""}`}
          />
        </Button>
        <div className="w-full">
          <Select
            value={currentStatus}
            onValueChange={handleStatusChange}
            disabled={isLoading}
          >
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
            disabled={isLoading}
            onCheckedChange={onShowHistoryChange}
          />
          <Label htmlFor="show-history" className="text-sm whitespace-nowrap">
            顯示歷史紀錄
          </Label>
        </div>
      </div>
    </div>
  );
}
