"use client";

import { useState } from "react";
import Image from "next/image";
import { DEFAULT_ROOM_IMAGE_SRC, getRoomImageSrc } from "@/lib/room-images";

export function RoomDetailImage({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  const [error, setError] = useState(false);
  const finalSrc = error ? DEFAULT_ROOM_IMAGE_SRC : getRoomImageSrc(src);

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
  );
}
