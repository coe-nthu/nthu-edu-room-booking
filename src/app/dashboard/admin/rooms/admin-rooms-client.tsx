"use client"

import { useState, useEffect } from "react"
import { Room } from "@/utils/supabase/queries"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toggleRoomStatus } from "@/app/actions/admin-rooms"
import { RoomFormDialog } from "./room-form-dialog"
import { toast } from "sonner"
import Image from "next/image"
import { PlusCircle, Pencil, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

type AdminRoomsClientProps = {
  initialRooms: Room[]
}

export function AdminRoomsClient({ initialRooms }: AdminRoomsClientProps) {
  const [rooms, setRooms] = useState(initialRooms)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [targetRoom, setTargetRoom] = useState<{ id: string, name: string, isActive: boolean } | null>(null)
  const [mounted, setMounted] = useState(false)

  // 確保客戶端 hydration 完成後才渲染 Radix UI 組件，避免 ID 不匹配
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleToggleStatus = (room: Room) => {
    if (room.is_active) {
      // If currently active, we are about to disable it -> show confirmation
      setTargetRoom({ id: room.id, name: room.name, isActive: false })
      setIsConfirmOpen(true)
    } else {
      // If currently inactive, we enable it directly (or could also confirm, but usually enabling is safe)
      executeToggle(room.id, true)
    }
  }

  const executeToggle = async (id: string, newStatus: boolean) => {
    try {
      await toggleRoomStatus(id, newStatus)
      setRooms(rooms.map(r => r.id === id ? { ...r, is_active: newStatus } : r))
      toast.success(newStatus ? "空間已啟用" : "空間已停用")
    } catch (error) {
      toast.error("操作失敗，請稍後再試")
      console.error(error)
    } finally {
      setIsConfirmOpen(false)
      setTargetRoom(null)
    }
  }

  // 在 mounted 之前顯示 loading 狀態
  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">圖片</TableHead>
                <TableHead>名稱</TableHead>
                <TableHead>代號</TableHead>
                <TableHead>類型</TableHead>
                <TableHead>樓層</TableHead>
                <TableHead>人數</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="w-16 h-10" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <RoomFormDialog mode="create">
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                新增空間
            </Button>
        </RoomFormDialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">圖片</TableHead>
              <TableHead>名稱</TableHead>
              <TableHead>代號</TableHead>
              <TableHead>類型</TableHead>
              <TableHead>樓層</TableHead>
              <TableHead>人數</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.map((room) => (
              <TableRow key={room.id}>
                <TableCell>
                   <div className="relative w-16 h-10 bg-muted rounded overflow-hidden">
                      <AdminRoomImage src={room.image_url} alt={room.name} />
                   </div>
                </TableCell>
                <TableCell className="font-medium">{room.name}</TableCell>
                <TableCell>{room.room_code}</TableCell>
                <TableCell>{room.room_type}</TableCell>
                <TableCell>{room.floor}</TableCell>
                <TableCell>{room.capacity}</TableCell>
                <TableCell>
                   {room.is_active ? (
                       <Badge variant="default" className="bg-green-600 hover:bg-green-700">啟用中</Badge>
                   ) : (
                       <Badge variant="destructive">已停用</Badge>
                   )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Switch 
                    checked={room.is_active !== false} // Handle null as true (legacy)
                    onCheckedChange={() => handleToggleStatus(room)}
                  />
                  <RoomFormDialog mode="edit" room={room}>
                    <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                    </Button>
                  </RoomFormDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要停用此空間嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              您即將停用 <strong>{targetRoom?.name}</strong>。
              <br />
              停用後，使用者將無法在列表中看到此空間，也無法進行預約。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction 
                onClick={() => targetRoom && executeToggle(targetRoom.id, false)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
                確認停用
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function AdminRoomImage({ src, alt }: { src: string | null, alt: string }) {
    const [error, setError] = useState(false)
    const finalSrc = (src && !error) ? src : "/login_cover.jpg"

    return (
        <Image 
            src={finalSrc} 
            alt={alt}
            fill
            className="object-cover"
            onError={() => setError(true)}
        />
    )
}
