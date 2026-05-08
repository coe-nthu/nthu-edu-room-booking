"use client"

import { useState } from "react"
import { Room } from "@/utils/supabase/queries"
import { SemesterSetting } from "@/utils/semester"
import { BookingWidget } from "./booking-widget"
import { RoomTimetable } from "@/app/dashboard/book/room-timetable"
import { RoomDetailImage } from "./room-detail-image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { Users, Layers, ArrowLeft } from "lucide-react"

type SpaceBookingClientProps = {
    room: Room
    semesters: SemesterSetting[]
    isAdmin: boolean
}

export function SpaceBookingClient({ room, semesters, isAdmin }: SpaceBookingClientProps) {
    const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)

    return (
        <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[380px_1fr] items-start">
                <div className="space-y-6">
                    <Button variant="ghost" asChild className="pl-0">
                        <Link href="/dashboard/spaces">
                            <ArrowLeft className="mr-2 h-4 w-4" /> 返回空間一覽
                        </Link>
                    </Button>

                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{room.name}</h1>
                            <div className="flex gap-2">
                                {room.room_type && <Badge variant="secondary">{room.room_type}</Badge>}
                                <Badge variant="outline">{room.room_code}</Badge>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end pt-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span className="text-sm">可容納 {room.capacity} 人</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Layers className="h-4 w-4" />
                                <span className="text-sm">位於 {room.floor}</span>
                            </div>
                            <div className="pt-2">
                                <span className="text-sm text-slate-500 font-medium whitespace-nowrap">※ 淺灰色區域為禁止借用時段</span>
                            </div>
                        </div>
                    </div>
                    {/* Image & Basic Info */}
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                        <RoomDetailImage src={room.image_url} alt={room.name} />
                    </div>

                    <div>

                        {/* Booking Widget */}
                        <BookingWidget
                            room={room}
                            semesters={semesters}
                            isAdmin={isAdmin}
                            selectedSlot={selectedSlot}
                            onChange={setSelectedSlot}
                        />
                    </div>

                    <Separator className="my-4" />

                    <h3 className="font-semibold mb-2">空間設備</h3>
                    <div className="text-sm text-muted-foreground mb-6">
                        {Array.isArray(room.equipment) && room.equipment.length > 0 ? (
                            <ul className="list-disc list-inside">
                                {room.equipment.map((item: unknown, i: number) => (
                                    <li key={i}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
                                ))}
                            </ul>
                        ) : (
                            <p>無特別標註設備</p>
                        )}
                    </div>
                </div>

                {/* Timetable */}
                <div className="space-y-4">
                    <RoomTimetable
                        roomId={room.id}
                        onSelectSlot={setSelectedSlot}
                        selectedSlot={selectedSlot}
                        unavailablePeriods={room.unavailable_periods}
                    />
                </div>
            </div>
        </div>
    )
}
