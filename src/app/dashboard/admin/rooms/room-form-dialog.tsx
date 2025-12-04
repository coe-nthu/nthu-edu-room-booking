"use client"

import { useState, useRef } from "react"
import { Room } from "@/utils/supabase/queries"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createRoom, updateRoom, uploadRoomImage } from "@/app/actions/admin-rooms"
import { toast } from "sonner"
import { Loader2, Upload, X } from "lucide-react"
import Image from "next/image"

type RoomFormDialogProps = {
  mode: "create" | "edit"
  room?: Room
  children: React.ReactNode
}

export function RoomFormDialog({ mode, room, children }: RoomFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Form State
  const [name, setName] = useState(room?.name || "")
  const [roomCode, setRoomCode] = useState(room?.room_code || "")
  const [floor, setFloor] = useState(room?.floor || "")
  const [capacity, setCapacity] = useState(room?.capacity?.toString() || "")
  const [roomType, setRoomType] = useState(room?.room_type || "")
  const [equipment, setEquipment] = useState(
    Array.isArray(room?.equipment) ? room?.equipment.join(", ") : ""
  )
  const [imageUrl, setImageUrl] = useState(room?.image_url || "")
  
  // Image Upload State
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const floorOptions = ["B1F", "1F", "2F", "3F", "4F", "5F", "6F", "7F", "8F"]

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
        const url = await uploadRoomImage(formData)
        setImageUrl(url)
        toast.success("圖片上傳成功")
    } catch (error) {
        console.error(error)
        toast.error("圖片上傳失敗")
    } finally {
        setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const equipmentArray = equipment.split(",").map(s => s.trim()).filter(Boolean)
      
      const data = {
        name,
        room_code: roomCode,
        floor,
        capacity: capacity ? parseInt(capacity) : null,
        room_type: roomType,
        equipment: equipmentArray,
        image_url: imageUrl || null, // Ensure empty string becomes null
      }

      if (mode === "create") {
        await createRoom(data)
        toast.success("已新增空間")
      } else if (room) {
        await updateRoom(room.id, data)
        toast.success("已更新空間資訊")
      }
      setOpen(false)
    } catch (error) {
      console.error(error)
      toast.error("儲存失敗")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "新增空間" : "編輯空間"}</DialogTitle>
            <DialogDescription>
              請輸入空間詳細資訊。點擊儲存以套用變更。
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Image Upload Section */}
            <div className="flex flex-col items-center gap-4">
                <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/25 flex items-center justify-center group">
                    {imageUrl ? (
                        <>
                            <Image 
                                src={imageUrl} 
                                alt="Preview" 
                                fill 
                                className="object-cover" 
                                onError={() => setImageUrl("")} // Fallback on error
                            />
                            <div className="absolute top-2 right-2 z-10">
                                <Button 
                                    type="button" 
                                    variant="destructive" 
                                    size="icon" 
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setImageUrl("")
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                <Button type="button" variant="secondary" size="sm" className="pointer-events-auto" onClick={() => fileInputRef.current?.click()}>
                                    更換圖片
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center p-4">
                            <Button type="button" variant="ghost" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="mr-2 h-4 w-4" />
                                上傳封面圖片
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2">支援 JPG, PNG 格式</p>
                        </div>
                    )}
                    {isUploading && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    )}
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="name">空間名稱</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                <Label htmlFor="roomCode">空間代號</Label>
                <Input id="roomCode" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="floor">樓層</Label>
                    <Select value={floor} onValueChange={setFloor}>
                        <SelectTrigger id="floor">
                            <SelectValue placeholder="選擇樓層" />
                        </SelectTrigger>
                        <SelectContent>
                            {floorOptions.map((f) => (
                                <SelectItem key={f} value={f}>
                                    {f}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="capacity">容納人數</Label>
                    <Input id="capacity" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="roomType">類型</Label>
                    <Input id="roomType" value={roomType} onChange={(e) => setRoomType(e.target.value)} placeholder="例: 會議室" />
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipment">設備清單</Label>
              <Input 
                id="equipment" 
                value={equipment} 
                onChange={(e) => setEquipment(e.target.value)} 
                placeholder="投影機, 白板, 麥克風 (以逗號分隔)"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isLoading || isUploading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              儲存變更
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
