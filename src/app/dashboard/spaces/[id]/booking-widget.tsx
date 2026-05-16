"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CheckCircle2, Info, Loader2, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Room } from "@/utils/supabase/queries";
import type { SemesterSetting } from "@/utils/semester";
import { validateBookingRules, generateTimeSlots } from "@/lib/booking-rules";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { isDateWithin4Months, isDateInLockedPeriod } from "@/utils/semester";
import { useUser } from "@/hooks/use-user";

type BookingWidgetProps = {
  room: Room;
  semesters: SemesterSetting[];
  isAdmin: boolean;
  selectedSlot: { start: Date; end: Date } | null;
  onChange: (slot: { start: Date; end: Date } | null) => void;
};

export function BookingWidget({
  room,
  semesters,
  isAdmin,
  selectedSlot,
  onChange,
}: BookingWidgetProps) {
  const router = useRouter();
  const { user, loading } = useUser(); // Check loading state to ensure auth is checked
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRestoredPendingBooking, setHasRestoredPendingBooking] =
    useState(false);

  // Restore booking data from localStorage if available and user is logged in
  useEffect(() => {
    if (loading) return; // Wait for auth check

    const storedBooking = localStorage.getItem(`pendingBooking_${room.id}`);
    if (storedBooking) {
      try {
        const {
          start,
          end,
          purpose: storedPurpose,
        } = JSON.parse(storedBooking);
        const startDate = new Date(start);
        const endDate = new Date(end);

        // Only restore if dates are valid
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          onChange({ start: startDate, end: endDate });
          if (storedPurpose) setPurpose(storedPurpose);

          // If user is logged in, open the dialog automatically to continue
          // If not logged in, just filling the form is enough (they will hit reserve again)
          if (user) {
            setIsDialogOpen(true);
            setHasRestoredPendingBooking(true);
            // Clear storage after successfully restoring
            localStorage.removeItem(`pendingBooking_${room.id}`);
          }
        }
      } catch (e) {
        console.error("Failed to parse stored booking", e);
        localStorage.removeItem(`pendingBooking_${room.id}`);
      }
    }
  }, [user, loading, room.id, onChange]);

  const getBookingValidationMessage = () => {
    if (!selectedSlot) return "請先選擇預約時間";

    const validation = validateBookingRules(
      selectedSlot.start,
      selectedSlot.end,
      room.id,
      [room],
      semesters,
      isAdmin,
    );

    return validation.isValid ? null : validation.message;
  };

  const handleReserveClick = () => {
    const validationMessage = getBookingValidationMessage();

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    if (loading) {
      toast.error("正在確認登入狀態，請稍候");
      return;
    }

    if (!user && selectedSlot) {
      const bookingData = {
        start: selectedSlot.start.toISOString(),
        end: selectedSlot.end.toISOString(),
        purpose: purpose.trim(),
      };
      localStorage.setItem(
        `pendingBooking_${room.id}`,
        JSON.stringify(bookingData),
      );

      toast.error("請先登入以繼續預約，已保留您選擇的時間");
      const returnUrl = window.location.pathname;
      router.push(`/login?next=${encodeURIComponent(returnUrl)}`);
      return;
    }

    setHasRestoredPendingBooking(false);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    const validationMessage = getBookingValidationMessage();

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    if (purpose.trim().length < 5) {
      toast.error("事由至少需要 5 個字");
      return;
    }

    if (!selectedSlot) return;

    if (!user) {
      const bookingData = {
        start: selectedSlot.start.toISOString(),
        end: selectedSlot.end.toISOString(),
        purpose: purpose.trim(),
      };
      localStorage.setItem(
        `pendingBooking_${room.id}`,
        JSON.stringify(bookingData),
      );

      toast.error("請先登入以送出申請，已保留您填寫的預約資料");
      const returnUrl = window.location.pathname;
      router.push(`/login?next=${encodeURIComponent(returnUrl)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: room.id,
          startTime: selectedSlot.start.toISOString(),
          endTime: selectedSlot.end.toISOString(),
          purpose: purpose.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "預約失敗");
      }

      toast.success("預約申請已送出");
      setIsDialogOpen(false);
      setHasRestoredPendingBooking(false);
      setPurpose("");
      onChange(null);
      // Clear any stored booking data just in case
      localStorage.removeItem(`pendingBooking_${room.id}`);
      router.push("/dashboard/my-bookings");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "預約失敗";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeSlots = generateTimeSlots();

  // Helper to handle time changes
  const updateTime = (type: "start" | "end", timeStr: string) => {
    if (!selectedSlot) return;

    const [hours, minutes] = timeStr.split(":").map(Number);
    const newDate = new Date(selectedSlot.start); // Keep the date same as start
    newDate.setHours(hours, minutes, 0, 0);

    if (type === "start") {
      // If new start is after current end, push end forward by 30 mins
      if (newDate >= selectedSlot.end) {
        const newEnd = new Date(newDate.getTime() + 1800000); // +30 mins
        onChange({ start: newDate, end: newEnd });
      } else {
        onChange({ ...selectedSlot, start: newDate });
      }
    } else {
      // Construct the end date properly (same day as start)
      const newEndDate = new Date(selectedSlot.start);
      newEndDate.setHours(hours, minutes, 0, 0);

      onChange({ ...selectedSlot, end: newEndDate });
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    // If we already have a slot, keep the time but update the date
    if (selectedSlot) {
      const newStart = new Date(date);
      newStart.setHours(
        selectedSlot.start.getHours(),
        selectedSlot.start.getMinutes(),
        0,
        0,
      );

      const newEnd = new Date(date);
      newEnd.setHours(
        selectedSlot.end.getHours(),
        selectedSlot.end.getMinutes(),
        0,
        0,
      );

      onChange({ start: newStart, end: newEnd });
    } else {
      // If no slot selected, default to 08:00 - 09:00 on the selected date
      const newStart = new Date(date);
      newStart.setHours(8, 0, 0, 0);

      const newEnd = new Date(date);
      newEnd.setHours(9, 0, 0, 0);

      onChange({ start: newStart, end: newEnd });
    }
  };

  // Get current start/end time strings
  const startTimeStr = selectedSlot ? format(selectedSlot.start, "HH:mm") : "";
  const endTimeStr = selectedSlot ? format(selectedSlot.end, "HH:mm") : "";

  const isMeetingRoom = room.room_type === "Meeting";
  const isGuest = !loading && !user;
  const submitButtonLabel = isGuest ? "登入後送出申請" : "確認送出";

  return (
    <>
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden sticky top-4">
        <div className="p-6 flex flex-col gap-4">
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800">
            {/* Date Section */}
            <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                日期
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start p-0 h-auto font-medium hover:bg-transparent text-left",
                      !selectedSlot && "text-muted-foreground",
                    )}
                  >
                    {selectedSlot ? (
                      format(selectedSlot.start, "yyyy 年 M 月 d 日")
                    ) : (
                      <span>選擇日期</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedSlot?.start}
                    onSelect={handleDateSelect}
                    initialFocus
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);

                      // Always disable past dates
                      if (date < today) return true;

                      // If user is NOT admin, apply additional restrictions
                      if (!isAdmin) {
                        // 7-day rule
                        const minDate = new Date(today);
                        minDate.setDate(today.getDate() + 7);
                        if (date < minDate) return true;

                        // 4-month limit
                        if (!isDateWithin4Months(date)) return true;

                        // Semester lock (skip for Meeting rooms)
                        if (
                          !isMeetingRoom &&
                          isDateInLockedPeriod(date, semesters, false)
                        )
                          return true;
                      }

                      return false;
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Section */}
            <div className="grid grid-cols-1">
              <Select
                value={startTimeStr}
                onValueChange={(v) => updateTime("start", v)}
                disabled={!selectedSlot}
              >
                <SelectTrigger className="min-h-[72px] w-full min-w-0 rounded-none border-0 border-b border-neutral-200 p-3 text-left shadow-none focus-visible:ring-0 dark:border-neutral-800 [&>svg]:mt-5">
                  <span className="flex min-w-0 flex-1 flex-col items-start gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      開始
                    </span>
                    <SelectValue placeholder="--" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={endTimeStr}
                onValueChange={(v) => updateTime("end", v)}
                disabled={!selectedSlot}
              >
                <SelectTrigger className="min-h-[72px] w-full min-w-0 rounded-none border-0 p-3 text-left shadow-none focus-visible:ring-0 [&>svg]:mt-5">
                  <span className="flex min-w-0 flex-1 flex-col items-start gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      結束
                    </span>
                    <SelectValue placeholder="--" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-lg h-12 font-semibold"
            onClick={handleReserveClick}
            disabled={!selectedSlot}
          >
            預約
          </Button>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {isGuest
              ? "未登入也可以先選擇時間；按下預約後會先帶你登入，回來再填寫事由並確認送出。"
              : "送出前系統會重新檢查時段是否仍可借用。"}
          </p>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認預約資訊</DialogTitle>
            <DialogDescription>
              {hasRestoredPendingBooking
                ? "已帶入登入前選擇的時間與事由，請再次確認後送出。"
                : "請確認空間、時間與借用事由。"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              <div className="font-medium text-foreground">{room.name}</div>
              <div className="mt-1 text-muted-foreground">
                {selectedSlot && format(selectedSlot.start, "yyyy/MM/dd HH:mm")}{" "}
                - {selectedSlot && format(selectedSlot.end, "HH:mm")}
              </div>
            </div>

            {hasRestoredPendingBooking ? (
              <div className="flex gap-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100">
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div className="space-y-1">
                  <div className="font-medium">已保留剛剛填寫的內容</div>
                  <div className="leading-relaxed">
                    系統不會自動送出登入前的申請；請確認時段與事由後，再按「確認送出」。
                  </div>
                </div>
              </div>
            ) : isGuest ? (
              <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div className="space-y-1">
                  <div className="font-medium">送出申請前需要登入</div>
                  <div className="leading-relaxed">
                    按下「登入後送出申請」後會先帶你登入，回來時會保留時間與事由，並讓你重新確認後再送出。
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                <div className="leading-relaxed">
                  送出後會建立預約申請；若登入期間時段已被占用，系統會提醒你重新選擇。
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="purpose">借用事由</Label>
              <Textarea
                id="purpose"
                placeholder="請簡述借用目的、活動內容..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  提交中...
                </>
              ) : isGuest ? (
                <>
                  <LogIn className="h-4 w-4" />
                  {submitButtonLabel}
                </>
              ) : loading ? (
                "確認登入狀態..."
              ) : (
                submitButtonLabel
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
