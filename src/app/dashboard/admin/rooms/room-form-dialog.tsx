"use client"

import { useState, useRef, useEffect } from "react"
import { Room } from "@/utils/supabase/queries"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createRoom,
  deleteRoomImage,
  updateRoom,
  uploadRoomImage,
} from "@/app/actions/admin-rooms"
import { RoomAvailabilityTable, UnavailablePeriod } from "./room-availability-table"
import { toast } from "sonner"
import { ImagePlus, Loader2, Star, Upload, X, HelpCircle } from "lucide-react"
import Image from "next/image"
import {
  getPrimaryRoomImage,
  getRoomImageSrc,
  MAX_ROOM_IMAGES,
  normalizeRoomImageList,
} from "@/lib/room-images"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { RoomApproverEditor, ApproverEntry, UserOption } from "./room-approver-editor"
import { getRoomApprovers, setRoomApprovers, getUsersForApproverSelection } from "@/app/actions/admin-approvers"
import { Separator } from "@/components/ui/separator"

type RoomFormDialogProps = {
  mode: "create" | "edit"
  room?: Room
  /** 現有空間類型清單，用於下拉選單 */
  roomTypeOptions?: string[]
  onRoomImagesChange?: (
    roomId: string,
    images: { image_url: string | null; image_urls: string[] },
  ) => void
  children: React.ReactNode
}

export function RoomFormDialog({
  mode,
  room,
  roomTypeOptions = [],
  onRoomImagesChange,
  children,
}: RoomFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Form State
  const [name, setName] = useState(room?.name || "")
  const [roomCode, setRoomCode] = useState(room?.room_code || "")
  const [floor, setFloor] = useState(room?.floor || "")
  const [capacity, setCapacity] = useState(room?.capacity?.toString() || "")
  const [roomType, setRoomType] = useState(room?.room_type || "")
  const [selectedRoomType, setSelectedRoomType] = useState(
    room && room.room_type && roomTypeOptions.includes(room.room_type)
      ? room.room_type
      : "",
  )
  const [customRoomType, setCustomRoomType] = useState(
    room && room.room_type && !roomTypeOptions.includes(room.room_type)
      ? room.room_type
      : "",
  )
  const [equipment, setEquipment] = useState(
    Array.isArray(room?.equipment) ? room?.equipment.join(", ") : ""
  )
  const [imageUrls, setImageUrls] = useState<string[]>(
    normalizeRoomImageList(room?.image_urls, room?.image_url),
  )
  const [primaryImageUrl, setPrimaryImageUrl] = useState(
    getPrimaryRoomImage(room?.image_url, room?.image_urls) || "",
  )
  const [unavailablePeriods, setUnavailablePeriods] = useState<UnavailablePeriod[]>(
    (room?.unavailable_periods && Array.isArray(room.unavailable_periods)) 
      ? room.unavailable_periods 
      : []
  )
  const [allowNoon, setAllowNoon] = useState(room?.allow_noon || false)
  const [adminOnly, setAdminOnly] = useState(room?.admin_only || false)

  // Approver State
  const [approvers, setApprovers] = useState<ApproverEntry[]>([])
  const [userOptions, setUserOptions] = useState<UserOption[]>([])
  const [isLoadingApprovers, setIsLoadingApprovers] = useState(false)
  
  // Unsaved changes confirmation
  const [initialState, setInitialState] = useState<string>("")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // Image Upload State
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [deletingImageUrl, setDeletingImageUrl] = useState<string | null>(null)

  const floorOptions = ["B1F", "1F", "2F", "3F", "4F", "5F", "6F", "7F", "8F"]

  // Meeting rooms don't need unavailable periods (no semester schedule dependency)
  const isMeetingRoom = roomType === "Meeting"

  // Load approver data when dialog opens
  useEffect(() => {
    if (open) {
      const loadApproverData = async () => {
        setIsLoadingApprovers(true)
        try {
          const users = await getUsersForApproverSelection()
          setUserOptions(users)
          if (room) {
            const existingApprovers = await getRoomApprovers(room.id)
            setApprovers(existingApprovers.map(a => ({
              user_id: a.user_id,
              step_order: a.step_order,
              label: a.label || '',
            })))
          } else {
            setApprovers([])
          }
        } catch (error) {
          console.error('Error loading approver data:', error)
        } finally {
          setIsLoadingApprovers(false)
        }
      }
      loadApproverData()
    }
  }, [open, room])

  // Reset form when dialog opens or room changes
  useEffect(() => {
    if (open && room) {
      setName(room.name || "")
      setRoomCode(room.room_code || "")
      setFloor(room.floor || "")
      setCapacity(room.capacity?.toString() || "")
      setRoomType(room.room_type || "")
      setSelectedRoomType(
        room.room_type && roomTypeOptions.includes(room.room_type)
          ? room.room_type
          : ""
      )
      setCustomRoomType(
        room.room_type && !roomTypeOptions.includes(room.room_type)
          ? room.room_type
          : ""
      )
      setEquipment(
        Array.isArray(room.equipment) ? room.equipment.join(", ") : ""
      )
      const nextImageUrls = normalizeRoomImageList(
        room.image_urls,
        room.image_url,
      )
      setImageUrls(nextImageUrls)
      setPrimaryImageUrl(getPrimaryRoomImage(room.image_url, nextImageUrls) || "")
      setUnavailablePeriods(
        (room.unavailable_periods && Array.isArray(room.unavailable_periods))
          ? room.unavailable_periods
          : []
      )
      setAllowNoon(room.allow_noon || false)
      setAdminOnly(room.admin_only || false)
    } else if (open && mode === "create") {
      // Reset to defaults for create mode
      setName("")
      setRoomCode("")
      setFloor("")
      setCapacity("")
      setRoomType("")
      setSelectedRoomType("")
      setCustomRoomType("")
      setEquipment("")
      setImageUrls([])
      setPrimaryImageUrl("")
      setUnavailablePeriods([])
      setAllowNoon(false)
      setAdminOnly(false)
    }
  }, [open, room, mode, roomTypeOptions])

  // Capture initial state for unsaved changes detection
  useEffect(() => {
    if (open && !isLoadingApprovers) {
      setInitialState(JSON.stringify({
        name,
        roomCode,
        floor,
        capacity,
        roomType,
        selectedRoomType,
        customRoomType,
        equipment,
        imageUrls,
        primaryImageUrl,
        unavailablePeriods,
        allowNoon,
        adminOnly,
        approvers
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isLoadingApprovers]) // Only run when dialog opens or approvers finish loading

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      const currentState = JSON.stringify({
        name,
        roomCode,
        floor,
        capacity,
        roomType,
        selectedRoomType,
        customRoomType,
        equipment,
        imageUrls,
        primaryImageUrl,
        unavailablePeriods,
        allowNoon,
        adminOnly,
        approvers
      })
      
      if (currentState !== initialState) {
        setShowConfirmDialog(true)
        return
      }
    }
    setOpen(newOpen)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    const remainingSlots = MAX_ROOM_IMAGES - imageUrls.length
    if (remainingSlots <= 0) {
      toast.error(`最多只能上傳 ${MAX_ROOM_IMAGES} 張圖片`)
      e.target.value = ""
      return
    }

    setIsUploading(true)

    try {
      const filesToUpload = files.slice(0, remainingSlots)
      const uploadedUrls: string[] = []

      for (const file of filesToUpload) {
        const formData = new FormData()
        formData.append('file', file)
        const url = await uploadRoomImage(formData)
        uploadedUrls.push(url)
      }

      const nextImages = normalizeRoomImageList([...imageUrls, ...uploadedUrls])
      setImageUrls(nextImages)
      if (!primaryImageUrl && nextImages[0]) {
        setPrimaryImageUrl(nextImages[0])
      }

      if (files.length > remainingSlots) {
        toast.warning(`已上傳前 ${remainingSlots} 張圖片，最多只能保留 ${MAX_ROOM_IMAGES} 張`)
      } else {
        toast.success(filesToUpload.length > 1 ? "圖片上傳成功" : "圖片上傳成功")
      }
    } catch (error) {
        console.error(error)
        toast.error("圖片上傳失敗")
    } finally {
        setIsUploading(false)
        e.target.value = ""
    }
  }

  const handleRemoveImage = async (targetUrl: string) => {
    setDeletingImageUrl(targetUrl)
    const nextImages = imageUrls.filter((url) => url !== targetUrl)
    const nextPrimaryImageUrl =
      primaryImageUrl === targetUrl ? nextImages[0] || "" : primaryImageUrl

    try {
      const result = await deleteRoomImage(targetUrl, {
        roomId: mode === "edit" ? room?.id : undefined,
        imageUrls: nextImages,
        primaryImageUrl: nextPrimaryImageUrl,
      })

      if (mode === "edit" && result.image_urls) {
        setImageUrls(result.image_urls)
        setPrimaryImageUrl(result.image_url || "")
        if (room?.id) {
          onRoomImagesChange?.(room.id, {
            image_url: result.image_url,
            image_urls: result.image_urls,
          })
        }
      } else {
        setImageUrls(nextImages)
        setPrimaryImageUrl(nextPrimaryImageUrl)
      }

      toast.success("圖片已刪除")
    } catch (error) {
      console.error(error)
      toast.error("圖片刪除失敗")
    } finally {
      setDeletingImageUrl(null)
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
        unavailable_periods: unavailablePeriods,
        image_url: primaryImageUrl || imageUrls[0] || null,
        image_urls: imageUrls,
        allow_noon: allowNoon,
        admin_only: adminOnly,
      }

      if (mode === "create") {
        await createRoom(data)
        // Note: For create mode, approvers need to be set after the room is created
        // We'll handle this via a page reload for simplicity
        toast.success("已新增空間")
      } else if (room) {
        await updateRoom(room.id, data)
        // Save approvers
        const validApprovers = approvers.filter(a => a.user_id)
        await setRoomApprovers(room.id, validApprovers)
        toast.success("已更新空間資訊")
      }
      if (typeof window !== "undefined") {
        window.location.reload()
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
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      <DialogContent className={isMeetingRoom ? "sm:max-w-[500px] max-h-[90vh] overflow-y-auto" : "sm:max-w-[1000px] max-h-[90vh] overflow-y-auto"}>
        <form onSubmit={handleSubmit}>
          <div className="absolute right-12 top-4 z-10 flex items-center gap-2">
            <Button type="submit" disabled={isLoading || isUploading || !!deletingImageUrl} size="sm" className="h-8">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              儲存變更
            </Button>
          </div>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "新增空間" : "編輯空間"}</DialogTitle>
            <DialogDescription>
              {isMeetingRoom 
                ? "請輸入空間詳細資訊。Meeting 類型空間不需設定課表時段限制。"
                : "請輸入空間詳細資訊。右側課表勾選的時段將不開放借用。"
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className={isMeetingRoom ? "py-4" : "grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 py-4"}>
            <div className="space-y-4">
            {/* Image Upload Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Label>空間圖片</Label>
                <span className="text-xs text-muted-foreground">
                  {imageUrls.length}/{MAX_ROOM_IMAGES}
                </span>
              </div>
              <div className="relative h-48 w-full overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted">
                {primaryImageUrl ? (
                  <Image
                    src={getRoomImageSrc(primaryImageUrl)}
                    alt="主圖預覽"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
                    <ImagePlus className="h-8 w-8 text-muted-foreground" />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      上傳空間圖片
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      最多 {MAX_ROOM_IMAGES} 張，第一張會自動設為主圖
                    </p>
                  </div>
                )}
                {primaryImageUrl && (
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-black/45 p-2">
                    <span className="inline-flex items-center gap-1 rounded bg-background/90 px-2 py-1 text-xs font-medium">
                      <Star className="h-3 w-3 fill-current" />
                      主圖
                    </span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || !!deletingImageUrl || imageUrls.length >= MAX_ROOM_IMAGES}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      新增圖片
                    </Button>
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                )}
              </div>
              {imageUrls.length > 0 && (
                <div className="grid grid-cols-5 gap-2">
                  {imageUrls.map((url, index) => {
                    const isPrimary = url === primaryImageUrl

                    return (
                      <div
                        key={`${url}-${index}`}
                        className={`group relative aspect-square overflow-hidden rounded-md border bg-muted ${
                          isPrimary ? "ring-2 ring-primary" : ""
                        }`}
                      >
                        <Image
                          src={getRoomImageSrc(url, {
                            width: 120,
                            height: 120,
                            quality: 60,
                          })}
                          alt={`空間圖片 ${index + 1}`}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                        <div className="absolute inset-0 flex flex-col justify-between bg-black/45 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            disabled={isPrimary}
                            onClick={() => setPrimaryImageUrl(url)}
                          >
                            {isPrimary ? "主圖" : "設為主圖"}
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="ml-auto h-7 w-7"
                            disabled={deletingImageUrl === url}
                            onClick={() => handleRemoveImage(url)}
                          >
                            {deletingImageUrl === url ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="name">名稱</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                <Label htmlFor="roomCode">編號</Label>
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
                    <div className="space-y-2">
                      <Select
                        value={selectedRoomType}
                        onValueChange={(value) => {
                          setSelectedRoomType(value)
                          setCustomRoomType("")
                          setRoomType(value)
                        }}
                      >
                        <SelectTrigger id="roomType">
                          <SelectValue placeholder="選擇類型（例如：會議室）" />
                        </SelectTrigger>
                        <SelectContent>
                          {roomTypeOptions.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                              aria-label="說明"
                            >
                              <HelpCircle className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[200px]">
                            <p className="text-xs">
                              先從上方清單選擇常用類型，若沒有符合的類別，可在下方輸入自訂類別。
                            </p>
                          </TooltipContent>
                        </Tooltip>
                        <Input
                          value={customRoomType}
                          onChange={(e) => {
                            const value = e.target.value
                            setCustomRoomType(value)
                            setSelectedRoomType("")
                            setRoomType(value)
                          }}
                          placeholder="輸入新類別"
                          className="flex-1"
                        />
                      </div>
                    </div>
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

            <div className="flex items-center space-x-2">
               <Switch id="allow-noon" checked={allowNoon} onCheckedChange={setAllowNoon} />
               <Label htmlFor="allow-noon">開放中午借用 (12:00 - 13:00)</Label>
            </div>

            <div className="flex items-center space-x-2">
               <Checkbox id="admin-only" checked={adminOnly} onCheckedChange={(checked) => setAdminOnly(checked as boolean)} />
               <Label htmlFor="admin-only">僅管理員可借用 (只有管理員能在空間頁面找到此空間)</Label>
            </div>

            {mode === "edit" && (
              <>
                <Separator />
                <RoomApproverEditor
                  approvers={approvers}
                  onChange={setApprovers}
                  userOptions={userOptions}
                  isLoading={isLoadingApprovers}
                />
              </>
            )}
            </div>

            {/* Unavailable periods section - hidden for Meeting rooms */}
            {!isMeetingRoom && (
              <div className="space-y-3">
                <div>
                  <Label className="text-base font-semibold">不開放借用時段</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    勾選的時段將不開放給使用者借用
                  </p>
                </div>
                <RoomAvailabilityTable value={unavailablePeriods} onChange={setUnavailablePeriods} />
              </div>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>確定要離開嗎？</AlertDialogTitle>
          <AlertDialogDescription>
            您有尚未儲存的變更，離開後這些變更將會遺失。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              setShowConfirmDialog(false)
              setOpen(false)
            }}
          >
            確定離開
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
