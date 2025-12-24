"use client"

import { useState, useEffect, useMemo } from "react"
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
import { PlusCircle, Pencil, Search } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type AdminRoomsClientProps = {
  initialRooms: Room[]
}

export function AdminRoomsClient({ initialRooms }: AdminRoomsClientProps) {
  const [rooms, setRooms] = useState(initialRooms)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [targetRoom, setTargetRoom] = useState<{ id: string, name: string, isActive: boolean } | null>(null)
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterFloor, setFilterFloor] = useState<string>("all")
  const [filterRoomType, setFilterRoomType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all")

  const floorOptions = useMemo(
    () =>
      Array.from(
        new Set(
          initialRooms
            .map((room) => room.floor)
            .filter((f): f is string => !!f && f.trim().length > 0),
        ),
      ).sort(),
    [initialRooms],
  )

  const roomTypeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          initialRooms
            .map((room) => room.room_type)
            .filter((t): t is string => !!t && t.trim().length > 0),
        ),
      ).sort(),
    [initialRooms],
  )

  const filteredRooms = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()

    return rooms.filter((room) => {
      // 搜尋：名稱與代號
      if (keyword) {
        const name = room.name?.toLowerCase() ?? ""
        const code = room.room_code?.toLowerCase() ?? ""
        if (!name.includes(keyword) && !code.includes(keyword)) {
          return false
        }
      }

      // 篩選：樓層
      if (filterFloor !== "all") {
        if ((room.floor ?? "") !== filterFloor) {
          return false
        }
      }

      // 篩選：類型
      if (filterRoomType !== "all") {
        if ((room.room_type ?? "") !== filterRoomType) {
          return false
        }
      }

      // 篩選：狀態
      if (filterStatus === "active") {
        if (room.is_active === false) return false
      } else if (filterStatus === "inactive") {
        if (room.is_active !== false) return false
      }

      return true
    })
  }, [rooms, searchTerm, filterFloor, filterRoomType, filterStatus])

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
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <RoomFormDialog mode="create" roomTypeOptions={roomTypeOptions}>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              新增空間
            </Button>
          </RoomFormDialog>
          <div className="text-xs text-muted-foreground">
            共 {rooms.length} 間空間
            {(searchTerm.trim() ||
              filterFloor !== "all" ||
              filterRoomType !== "all" ||
              filterStatus !== "all") &&
              `，目前顯示 ${filteredRooms.length} 間`}
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
          <div className="relative w-full md:w-64">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜尋名稱或代號..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select
              value={filterStatus}
              onValueChange={(value: "all" | "active" | "inactive") =>
                setFilterStatus(value)
              }
            >
              <SelectTrigger className="min-w-[120px]">
                <SelectValue placeholder="狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部狀態</SelectItem>
                <SelectItem value="active">啟用中</SelectItem>
                <SelectItem value="inactive">已停用</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filterFloor}
              onValueChange={(value) => setFilterFloor(value)}
            >
              <SelectTrigger className="min-w-[110px]">
                <SelectValue placeholder="樓層" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部樓層</SelectItem>
                {floorOptions.map((floor) => (
                  <SelectItem key={floor} value={floor}>
                    {floor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterRoomType}
              onValueChange={(value) => setFilterRoomType(value)}
            >
              <SelectTrigger className="min-w-[130px]">
                <SelectValue placeholder="空間類型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部類型</SelectItem>
                {roomTypeOptions.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
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
            {filteredRooms.map((room) => (
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
                  <RoomFormDialog mode="edit" room={room} roomTypeOptions={roomTypeOptions}>
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
            unoptimized={src?.includes('supabase.co')}
            onError={() => setError(true)}
        />
    )
}
