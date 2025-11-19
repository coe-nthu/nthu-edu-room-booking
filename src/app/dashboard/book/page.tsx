import { getRooms } from "@/utils/supabase/queries"
import { BookingForm } from "./booking-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function BookPage() {
  const rooms = await getRooms()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">預約空間</h2>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>填寫預約申請</CardTitle>
            <CardDescription>
              請依規定填寫，一般使用者需於 7 天前提出申請。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BookingForm rooms={rooms} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>借用規則說明</CardTitle>
            <p>為有效管理及運用本院大樓空間，並兼顧各單位業務推動需求，特將相關借用原則說明如下，請各系所周知並轉知師生遵循。</p>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p>1. 借用方法：填寫此表單申請</p>
            <p>2. 借用原則：由於會議室數量有限，學生口試請先洽借研討室使用，以利會議室供其他行政及學術需求使用。</p>
            <p>3. 收費說明：目前空間借用為利業務推動，暫不收取費用；惟後續將視使用狀況及實際需求，另行研議並訂定收費辦法。</p>
            <p>4. 鑰匙管理：借用人請至院辦公室辦理鑰匙借取與歸還手續，並依規定使用與維護空間。</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

