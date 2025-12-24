"use client"

import { useState, useMemo } from "react"
import { Room } from "@/utils/supabase/queries"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import Image from "next/image"
import { Search, Users, Layers, ArrowRight } from "lucide-react"

type SpaceListProps = {
  initialRooms: Room[]
}

export function SpaceList({ initialRooms }: SpaceListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFloor, setSelectedFloor] = useState<string>("all")
  const [selectedCapacity, setSelectedCapacity] = useState<string>("all")

  // Derive unique floors
  const floors = useMemo(() => {
    const uniqueFloors = Array.from(new Set(initialRooms.map(r => r.floor).filter(Boolean)))
    // Sort floors naturally (B1, 1F, 2F, etc.) - simplified sort for now
    return uniqueFloors.sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }))
  }, [initialRooms])

  // Filter logic
  const filteredRooms = useMemo(() => {
    return initialRooms.filter(room => {
      // Search term
      const searchContent = `${room.name} ${room.room_code || ''} ${room.room_type || ''}`.toLowerCase()
      if (searchTerm && !searchContent.includes(searchTerm.toLowerCase())) {
        return false
      }

      // Floor
      if (selectedFloor !== "all" && room.floor !== selectedFloor) {
        return false
      }

      // Capacity
      if (selectedCapacity !== "all") {
        const cap = room.capacity || 0
        if (selectedCapacity === "small" && cap <= 30) return true
        if (selectedCapacity === "medium" && cap > 30 && cap <= 50) return true
        if (selectedCapacity === "large" && cap > 50) return true
        
        // If we are here, it means it didn't match the selected capacity criteria
        return false
      }

      return true
    })
  }, [initialRooms, searchTerm, selectedFloor, selectedCapacity])

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      {/* Sidebar Filters */}
      <div className="space-y-6 lg:col-span-1">
         <div className="space-y-4">
            <div className="font-medium text-sm text-muted-foreground">關鍵字搜尋</div>
            <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="搜尋空間名稱..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                />
            </div>
         </div>

         <div className="space-y-4">
            <div className="font-medium text-sm text-muted-foreground">樓層</div>
            <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                <SelectTrigger>
                    <SelectValue placeholder="選擇樓層" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">全部樓層</SelectItem>
                    {floors.map(f => (
                        <SelectItem key={f as string} value={f as string}>{f}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
         </div>

         <div className="space-y-4">
            <div className="font-medium text-sm text-muted-foreground">容納人數</div>
             <Select value={selectedCapacity} onValueChange={setSelectedCapacity}>
                <SelectTrigger>
                    <SelectValue placeholder="選擇人數" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">不限</SelectItem>
                    <SelectItem value="small">30人以下</SelectItem>
                    <SelectItem value="medium">31-50人</SelectItem>
                    <SelectItem value="large">50人以上</SelectItem>
                </SelectContent>
            </Select>
         </div>
      </div>

      {/* Room Grid */}
      <div className="lg:col-span-3">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map(room => (
                <Card key={room.id} className="overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
                    <div className="relative aspect-video bg-muted">
                        <RoomImage 
                            src={room.image_url} 
                            alt={room.name} 
                        />
                         {room.room_type && (
                            <div className="absolute top-2 right-2">
                                <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm shadow-sm">
                                    {room.room_type}
                                </Badge>
                            </div>
                        )}
                    </div>
                    <CardContent className="p-4 flex-1">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                                <h3 className="font-bold truncate" title={room.name}>{room.name}</h3>
                                <p className="text-xs text-muted-foreground">{room.room_code}</p>
                            </div>
                        </div>
                        
                        <div className="space-y-2 text-sm text-muted-foreground mt-3">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>{room.capacity || 0} 人</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4" />
                                <span>{room.floor || '未標示'}</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 mt-auto">
                        <Button asChild className="w-full" variant="outline">
                            <Link href={`/dashboard/spaces/${room.id}`}>
                                查看詳情 <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            ))}
            
            {filteredRooms.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
                    <p>沒有找到符合條件的空間</p>
                    <Button variant="link" onClick={() => {
                        setSearchTerm("")
                        setSelectedFloor("all")
                        setSelectedCapacity("all")
                    }}>清除篩選條件</Button>
                </div>
            )}
        </div>
      </div>
    </div>
  )
}

// Helper component to handle image fallback
function RoomImage({ src, alt }: { src: string | null, alt: string }) {
    const [error, setError] = useState(false)
    const finalSrc = (src && !error) ? src : "/login_cover.jpg"
    
    return (
        <Image
            src={finalSrc}
            alt={alt}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            unoptimized={src?.includes('supabase.co')}
            onError={() => setError(true)}
        />
    )
}
