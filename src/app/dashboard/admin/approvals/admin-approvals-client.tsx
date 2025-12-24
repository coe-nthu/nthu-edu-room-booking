"use client"

import { useState } from "react"
import { ApprovalToolbar } from "./approval-toolbar"
import { BookingList, type Booking as BookingListItem } from "./booking-list"

interface AdminApprovalsClientProps {
  initialBookings: BookingListItem[]
}

export function AdminApprovalsClient({ initialBookings }: AdminApprovalsClientProps) {
  const [showHistory, setShowHistory] = useState(false)

  return (
    <>
      <ApprovalToolbar 
        showHistory={showHistory} 
        onShowHistoryChange={setShowHistory} 
      />
      <BookingList 
        initialBookings={initialBookings} 
        showHistory={showHistory}
      />
    </>
  )
}

