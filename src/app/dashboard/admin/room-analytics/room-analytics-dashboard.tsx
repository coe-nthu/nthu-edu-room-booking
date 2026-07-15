"use client";

import { useMemo, useState } from "react";
import type {
  DepartmentRoomBookingStatistic,
  RoomBookingStatistic,
} from "@/app/actions/admin-room-analytics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FilterX, Layers3, Search, SlidersHorizontal } from "lucide-react";

type AnalysisMode = "room" | "department";
type AnalyticsRow = RoomBookingStatistic | DepartmentRoomBookingStatistic;

type RoomAnalyticsDashboardProps = {
  roomStats: RoomBookingStatistic[];
  departmentRoomStats: DepartmentRoomBookingStatistic[];
};

function formatDateTime(value: string | null) {
  if (!value) return "尚無紀錄";

  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function isDepartmentRow(
  row: AnalyticsRow,
): row is DepartmentRoomBookingStatistic {
  return "department_name" in row;
}

export function RoomAnalyticsDashboard({
  roomStats,
  departmentRoomStats,
}: RoomAnalyticsDashboardProps) {
  const [mode, setMode] = useState<AnalysisMode>("room");
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("all");
  const [roomId, setRoomId] = useState("all");
  const [status, setStatus] = useState("all");

  const departments = useMemo(() => {
    const departmentMap = new Map<string, string>();

    departmentRoomStats.forEach((stat) => {
      departmentMap.set(
        String(stat.department_id ?? "unknown"),
        stat.department_name,
      );
    });

    return Array.from(departmentMap, ([id, name]) => ({ id, name })).sort(
      (a, b) => a.name.localeCompare(b.name, "zh-Hant"),
    );
  }, [departmentRoomStats]);

  const rooms = useMemo(
    () =>
      roomStats
        .map((stat) => ({ id: stat.room_id, name: stat.room_name }))
        .sort((a, b) => a.name.localeCompare(b.name, "zh-Hant")),
    [roomStats],
  );

  const filteredRows = useMemo(() => {
    const source: AnalyticsRow[] =
      mode === "room" ? roomStats : departmentRoomStats;
    const keyword = search.trim().toLocaleLowerCase("zh-TW");

    return source.filter((row) => {
      const departmentMatches =
        mode === "room" ||
        departmentId === "all" ||
        (isDepartmentRow(row) &&
          String(row.department_id ?? "unknown") === departmentId);
      const roomMatches = roomId === "all" || row.room_id === roomId;
      const statusMatches =
        status === "all" ||
        (status === "active" && row.is_active !== false) ||
        (status === "inactive" && row.is_active === false);
      const searchableText = [
        isDepartmentRow(row) ? row.department_name : "",
        row.room_name,
        row.room_code,
        row.floor,
        row.room_type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("zh-TW");

      return (
        departmentMatches &&
        roomMatches &&
        statusMatches &&
        (!keyword || searchableText.includes(keyword))
      );
    });
  }, [
    departmentId,
    departmentRoomStats,
    mode,
    roomId,
    roomStats,
    search,
    status,
  ]);

  const hasActiveFilters =
    search.trim() !== "" ||
    departmentId !== "all" ||
    roomId !== "all" ||
    status !== "all";
  const maxBookings = Math.max(
    1,
    ...filteredRows.map((row) => row.total_booking_count),
  );

  function changeMode(nextMode: AnalysisMode) {
    setMode(nextMode);
    if (nextMode === "room") setDepartmentId("all");
  }

  function resetFilters() {
    setSearch("");
    setDepartmentId("all");
    setRoomId("all");
    setStatus("all");
  }

  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <div className="border-b bg-muted/30 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Layers3 className="size-4 text-primary" aria-hidden="true" />
              <h2 className="font-semibold">借用分析工作區</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              目前顯示 {filteredRows.length} 筆，共{" "}
              {mode === "room" ? roomStats.length : departmentRoomStats.length}{" "}
              筆資料
            </p>
          </div>

          <div
            className="grid grid-cols-2 rounded-lg bg-muted p-1"
            aria-label="分析維度"
          >
            <Button
              type="button"
              size="sm"
              variant={mode === "room" ? "secondary" : "ghost"}
              className={mode === "room" ? "bg-background shadow-xs" : ""}
              aria-pressed={mode === "room"}
              onClick={() => changeMode("room")}
            >
              空間總覽
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "department" ? "secondary" : "ghost"}
              className={mode === "department" ? "bg-background shadow-xs" : ""}
              aria-pressed={mode === "department"}
              onClick={() => changeMode("department")}
            >
              單位 × 空間
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.4fr)_repeat(3,minmax(140px,0.7fr))_auto]">
          <div className="space-y-1.5 sm:col-span-2 xl:col-span-1">
            <Label htmlFor="analytics-search">關鍵字</Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="analytics-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="搜尋空間、代號、樓層或單位"
                className="bg-background pl-9"
              />
            </div>
          </div>

          {mode === "department" && (
            <div className="space-y-1.5">
              <Label htmlFor="department-filter">借用單位</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger
                  id="department-filter"
                  className="w-full bg-background"
                >
                  <SelectValue placeholder="全部單位" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部單位</SelectItem>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="room-filter">空間</Label>
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger id="room-filter" className="w-full bg-background">
                <SelectValue placeholder="全部空間" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部空間</SelectItem>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="status-filter">空間狀態</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger
                id="status-filter"
                className="w-full bg-background"
              >
                <SelectValue placeholder="全部狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部狀態</SelectItem>
                <SelectItem value="active">啟用中</SelectItem>
                <SelectItem value="inactive">已停用</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              type="button"
              variant="ghost"
              className="w-full xl:w-auto"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
            >
              <FilterX aria-hidden="true" />
              清除篩選
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b px-4 py-2 text-xs text-muted-foreground sm:px-5">
        <SlidersHorizontal className="size-3.5" aria-hidden="true" />
        {mode === "room"
          ? "每列代表一個空間的整體借用情形"
          : "每列代表一個單位在特定空間的借用情形"}
      </div>

      <div className="max-h-[68vh] overflow-auto [&_[data-slot=table-container]]:overflow-visible">
        <Table className="min-w-[1040px]">
          <TableHeader className="sticky top-0 z-10 bg-card shadow-[0_1px_0_var(--border)]">
            <TableRow className="hover:bg-transparent">
              {mode === "department" && <TableHead>借用單位</TableHead>}
              <TableHead>空間</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead className="text-right">總借用</TableHead>
              <TableHead className="text-right">近 30 天</TableHead>
              <TableHead className="text-right">近 90 天</TableHead>
              <TableHead className="text-right">平均每月</TableHead>
              <TableHead>常借用日</TableHead>
              <TableHead>最近借用</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={mode === "department" ? 9 : 8}
                  className="h-40 text-center"
                >
                  <div className="mx-auto max-w-sm whitespace-normal">
                    <p className="font-medium">找不到符合條件的資料</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      調整篩選條件，或清除篩選後查看全部結果。
                    </p>
                    {hasActiveFilters && (
                      <Button
                        type="button"
                        variant="link"
                        className="mt-2"
                        onClick={resetFilters}
                      >
                        清除所有篩選
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row) => {
                const bookingRatio =
                  (row.total_booking_count / maxBookings) * 100;

                return (
                  <TableRow
                    key={`${isDepartmentRow(row) ? (row.department_id ?? "unknown") : "all"}-${row.room_id}`}
                  >
                    {mode === "department" && (
                      <TableCell className="max-w-52 font-medium whitespace-normal">
                        {isDepartmentRow(row) ? row.department_name : "—"}
                      </TableCell>
                    )}
                    <TableCell className="min-w-52">
                      <div className="space-y-1.5">
                        <div className="font-medium">{row.room_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {[row.room_code, row.floor, row.room_type]
                            .filter(Boolean)
                            .join(" · ") || "無額外資訊"}
                        </div>
                        <div
                          className="h-1.5 overflow-hidden rounded-full bg-muted"
                          aria-hidden="true"
                        >
                          <div
                            className="h-full rounded-full bg-primary/75"
                            style={{ width: `${bookingRatio}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          row.is_active === false ? "destructive" : "secondary"
                        }
                      >
                        {row.is_active === false ? "已停用" : "啟用中"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {row.total_booking_count}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.bookings_last_30_days}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.bookings_last_90_days}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.average_bookings_per_month.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {row.most_booked_weekday
                        ? `${row.most_booked_weekday}（${row.most_booked_weekday_count} 次）`
                        : "尚無紀錄"}
                    </TableCell>
                    <TableCell>{formatDateTime(row.last_booked_at)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
