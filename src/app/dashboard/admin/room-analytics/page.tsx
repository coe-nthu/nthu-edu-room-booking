import {
  getRoomBookingStatistics,
  getRoomBookingStatisticsByDepartment,
  type RoomBookingStatistic,
} from "@/app/actions/admin-room-analytics";
import { RoomAnalyticsDashboard } from "@/app/dashboard/admin/room-analytics/room-analytics-dashboard";
import {
  Activity,
  Building2,
  CalendarDays,
  DoorOpen,
  Trophy,
} from "lucide-react";

function getTopRoom(stats: RoomBookingStatistic[]) {
  return stats.find((stat) => stat.total_booking_count > 0) ?? null;
}

export default async function AdminRoomAnalyticsPage() {
  const [stats, departmentRoomStats] = await Promise.all([
    getRoomBookingStatistics(),
    getRoomBookingStatisticsByDepartment(),
  ]);
  const totalBookings = stats.reduce(
    (total, stat) => total + stat.total_booking_count,
    0,
  );
  const recentBookings = stats.reduce(
    (total, stat) => total + stat.bookings_last_30_days,
    0,
  );
  const activeRooms = stats.filter((stat) => stat.is_active !== false).length;
  const topRoom = getTopRoom(stats);
  const departmentCount = new Set(
    departmentRoomStats.map((stat) => stat.department_id ?? "unknown"),
  ).size;
  const summaryItems = [
    {
      label: "總借用",
      value: totalBookings.toLocaleString("zh-TW"),
      detail: "已核准預約",
      icon: CalendarDays,
    },
    {
      label: "近 30 天",
      value: recentBookings.toLocaleString("zh-TW"),
      detail: "近期使用量",
      icon: Activity,
    },
    {
      label: "啟用空間",
      value: activeRooms.toLocaleString("zh-TW"),
      detail: `共 ${stats.length} 間`,
      icon: DoorOpen,
    },
    {
      label: "借用單位",
      value: departmentCount.toLocaleString("zh-TW"),
      detail: "有借用紀錄",
      icon: Building2,
    },
    {
      label: "最常借用",
      value: topRoom?.room_name ?? "尚無資料",
      detail: topRoom ? `${topRoom.total_booking_count} 次` : "無借用紀錄",
      icon: Trophy,
    },
  ];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">借用統計</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          切換分析維度並組合篩選條件，快速找到需要的空間使用資料。
        </p>
      </header>

      <section
        aria-label="統計摘要"
        className="grid overflow-hidden rounded-xl border bg-card shadow-xs sm:grid-cols-2 xl:grid-cols-5"
      >
        {summaryItems.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="flex min-w-0 items-center gap-3 border-b p-4 last:border-b-0 sm:nth-[2n+1]:border-r sm:nth-last-[-n+2]:border-b-0 xl:border-r xl:border-b-0 xl:last:border-r-0"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">
                  {item.label}
                </p>
                <p className="truncate text-lg font-semibold tabular-nums">
                  {item.value}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.detail}
                </p>
              </div>
            </div>
          );
        })}
      </section>

      <RoomAnalyticsDashboard
        roomStats={stats}
        departmentRoomStats={departmentRoomStats}
      />
    </div>
  );
}
