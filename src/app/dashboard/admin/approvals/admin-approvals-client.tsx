"use client";

import { ApprovalToolbar } from "./approval-toolbar";
import { BookingList, type Booking as BookingListItem } from "./booking-list";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface AdminApprovalsClientProps {
  initialBookings: BookingListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  showHistory: boolean;
}

export function AdminApprovalsClient({
  initialBookings,
  totalCount,
  page,
  pageSize,
  totalPages,
  showHistory,
}: AdminApprovalsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateSearchParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    router.push(`/dashboard/admin/approvals?${params.toString()}`);
  };

  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  return (
    <>
      <ApprovalToolbar
        showHistory={showHistory}
        onShowHistoryChange={(checked) =>
          updateSearchParams({ history: checked ? "1" : null, page: null })
        }
      />
      <BookingList initialBookings={initialBookings} />
      <div className="flex flex-col gap-3 pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div>
          顯示 {startItem}-{endItem} 筆，共 {totalCount} 筆
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={String(pageSize)}
            onValueChange={(value) =>
              updateSearchParams({
                pageSize: value === "50" ? null : value,
                page: null,
              })
            }
          >
            <SelectTrigger className="h-8 w-[96px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25 筆</SelectItem>
              <SelectItem value="50">50 筆</SelectItem>
              <SelectItem value="100">100 筆</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() =>
              updateSearchParams({
                page: page - 1 <= 1 ? null : String(page - 1),
              })
            }
          >
            <ChevronLeft className="h-4 w-4" />
            上一頁
          </Button>
          <span className="min-w-[72px] text-center">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => updateSearchParams({ page: String(page + 1) })}
          >
            下一頁
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
