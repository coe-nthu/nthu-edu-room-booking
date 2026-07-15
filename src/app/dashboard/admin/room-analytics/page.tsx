import {
  getRoomBookingStatistics,
  getRoomBookingStatisticsByDepartment,
  DepartmentRoomBookingStatistic,
  RoomBookingStatistic,
} from "@/app/actions/admin-room-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Activity, CalendarDays, Clock3, DoorOpen } from "lucide-react";

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
  const maxBookings = Math.max(
    1,
    ...stats.map((stat) => stat.total_booking_count),
  );
  const maxDepartmentRoomBookings = Math.max(
    1,
    ...departmentRoomStats.map((stat) => stat.total_booking_count),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">借用統計</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        借用單位來自借用者的個人資料；顯示「未設定單位」代表該帳號尚未設定系所。
      </p>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總借用次數</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings}</div>
            <p className="text-xs text-muted-foreground">已核准預約累計</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">近 30 天借用</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentBookings}</div>
            <p className="text-xs text-muted-foreground">近期空間使用量</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">啟用空間數</CardTitle>
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRooms}</div>
            <p className="text-xs text-muted-foreground">
              共 {stats.length} 間空間列入統計
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">借用單位數</CardTitle>
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departmentCount}</div>
            <p className="text-xs text-muted-foreground">有已核准預約的單位</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最常借用空間</CardTitle>
            <Clock3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="truncate text-2xl font-bold">
              {topRoom?.room_name ?? "尚無資料"}
            </div>
            <p className="text-xs text-muted-foreground">
              {topRoom
                ? `${topRoom.total_booking_count} 次借用`
                : "尚無已核准預約"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>空間借用分析</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>空間</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">總借用</TableHead>
                  <TableHead className="text-right">近 30 天</TableHead>
                  <TableHead className="text-right">平均每月</TableHead>
                  <TableHead>常借用天數</TableHead>
                  <TableHead>最近借用</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-muted-foreground"
                    >
                      目前沒有空間統計資料
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.map((stat) => {
                    const bookingRatio =
                      (stat.total_booking_count / maxBookings) * 100;

                    return (
                      <TableRow key={stat.room_id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{stat.room_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {[stat.room_code, stat.floor, stat.room_type]
                                .filter(Boolean)
                                .join(" · ") || "無額外資訊"}
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${bookingRatio}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              stat.is_active === false
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {stat.is_active === false ? "已停用" : "啟用中"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {stat.total_booking_count}
                        </TableCell>
                        <TableCell className="text-right">
                          {stat.bookings_last_30_days}
                        </TableCell>
                        <TableCell className="text-right">
                          {stat.average_bookings_per_month.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {stat.most_booked_weekday
                            ? `${stat.most_booked_weekday}（${stat.most_booked_weekday_count} 次）`
                            : "尚無紀錄"}
                        </TableCell>
                        <TableCell>
                          {formatDateTime(stat.last_booked_at)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>單位 × 空間借用分析</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table className="min-w-[980px]">
              <TableHeader>
                <TableRow>
                  <TableHead>借用單位</TableHead>
                  <TableHead>空間</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">總借用</TableHead>
                  <TableHead className="text-right">近 30 天</TableHead>
                  <TableHead className="text-right">近 90 天</TableHead>
                  <TableHead className="text-right">平均每月</TableHead>
                  <TableHead>常借用天數</TableHead>
                  <TableHead>最近借用</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departmentRoomStats.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-8 text-center text-muted-foreground"
                    >
                      目前沒有單位與空間的統計資料
                    </TableCell>
                  </TableRow>
                ) : (
                  departmentRoomStats.map(
                    (stat: DepartmentRoomBookingStatistic) => {
                      const bookingRatio =
                        (stat.total_booking_count / maxDepartmentRoomBookings) *
                        100;

                      return (
                        <TableRow
                          key={`${stat.department_id ?? "unknown"}-${stat.room_id}`}
                        >
                          <TableCell className="font-medium">
                            {stat.department_name}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">
                                {stat.room_name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {[stat.room_code, stat.floor, stat.room_type]
                                  .filter(Boolean)
                                  .join(" · ") || "無額外資訊"}
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-primary"
                                  style={{ width: `${bookingRatio}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                stat.is_active === false
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {stat.is_active === false ? "已停用" : "啟用中"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {stat.total_booking_count}
                          </TableCell>
                          <TableCell className="text-right">
                            {stat.bookings_last_30_days}
                          </TableCell>
                          <TableCell className="text-right">
                            {stat.bookings_last_90_days}
                          </TableCell>
                          <TableCell className="text-right">
                            {stat.average_bookings_per_month.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {stat.most_booked_weekday
                              ? `${stat.most_booked_weekday}（${stat.most_booked_weekday_count} 次）`
                              : "尚無紀錄"}
                          </TableCell>
                          <TableCell>
                            {formatDateTime(stat.last_booked_at)}
                          </TableCell>
                        </TableRow>
                      );
                    },
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
