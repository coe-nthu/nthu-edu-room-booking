import { z } from "zod"

export const bookingFormSchema = z.object({
  roomId: z.string({
    message: "請選擇空間",
  }),
  date: z.date({
    message: "請選擇日期",
  }),
  startTime: z.string({
    message: "請選擇開始時間",
  }),
  endTime: z.string({
    message: "請選擇結束時間",
  }),
  purpose: z.string().min(5, {
    message: "事由至少需要 5 個字",
  }),
}).refine((data) => {
  return data.endTime > data.startTime
}, {
  message: "結束時間必須晚於開始時間",
  path: ["endTime"],
})

export type BookingFormValues = z.infer<typeof bookingFormSchema>

