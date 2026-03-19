"use client"

import { useState } from "react"
import Image from "next/image"

export function RoomDetailImage({ src, alt }: { src: string | null, alt: string }) {
    const [error, setError] = useState(false)
    const finalSrc = (src && !error) ? src : "/login_cover.jpg"

    return (
        <Image
            src={finalSrc}
            alt={alt}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
            onError={() => setError(true)}
        />
    )
}

