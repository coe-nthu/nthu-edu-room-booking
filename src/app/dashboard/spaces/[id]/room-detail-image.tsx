"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  DEFAULT_ROOM_IMAGE_SRC,
  getRoomGalleryImages,
  getRoomImageSrc,
} from "@/lib/room-images";
import type { Room } from "@/utils/supabase/queries";

export function RoomImageGallery({ room }: { room: Room }) {
  const { primaryImage, thumbnailImages, images } = getRoomGalleryImages(
    room.image_url,
    room.image_urls,
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const mainImage = primaryImage ?? images[0] ?? null;

  const updateScrollState = useCallback(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    setCanScrollLeft(scrollElement.scrollLeft > 0);
    setCanScrollRight(
      scrollElement.scrollLeft + scrollElement.clientWidth <
        scrollElement.scrollWidth - 1,
    );
  }, []);

  useEffect(() => {
    updateScrollState();

    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    scrollElement.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);

    return () => {
      scrollElement.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [thumbnailImages.length, updateScrollState]);

  const scrollThumbnails = (direction: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -220 : 220,
      behavior: "smooth",
    });
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        className="group relative block aspect-video w-full overflow-hidden rounded-lg bg-muted text-left"
        onClick={() => setSelectedImage(mainImage)}
      >
        <GalleryImage
          src={mainImage}
          alt={room.name}
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
          className="transition-transform group-hover:scale-[1.02]"
        />
      </button>

      {thumbnailImages.length > 0 && (
        <div className="relative">
          {canScrollLeft && (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 z-10 h-8 w-8 -translate-y-1/2 rounded-full shadow-md"
              onClick={() => scrollThumbnails("left")}
              aria-label="看前面的圖片"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <div
            ref={scrollRef}
            className="flex gap-2 overflow-x-auto scroll-smooth pb-1"
          >
            {thumbnailImages.map((image, index) => (
              <button
                type="button"
                key={`${image}-${index}`}
                className="relative h-20 w-28 flex-none overflow-hidden rounded-md bg-muted ring-offset-background transition hover:ring-2 hover:ring-primary"
                onClick={() => setSelectedImage(image)}
                aria-label={`查看 ${room.name} 圖片 ${index + 2}`}
              >
                <GalleryImage
                  src={image}
                  alt={`${room.name} 圖片 ${index + 2}`}
                  sizes="112px"
                  transform={{ width: 224, height: 160, quality: 60 }}
                />
              </button>
            ))}
          </div>
          {canScrollRight && (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 z-10 h-8 w-8 -translate-y-1/2 rounded-full shadow-md"
              onClick={() => scrollThumbnails("right")}
              aria-label="看更多圖片"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      <Dialog
        open={!!selectedImage}
        onOpenChange={(open) => {
          if (!open) setSelectedImage(null);
        }}
      >
        <DialogContent
          className="border-0 bg-transparent p-0 shadow-none sm:max-w-5xl"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">{room.name} 圖片預覽</DialogTitle>
          <div className="relative aspect-video w-[min(92vw,1100px)] overflow-hidden rounded-lg bg-black">
            <GalleryImage
              src={selectedImage}
              alt={`${room.name} 大圖預覽`}
              sizes="92vw"
              priority
              objectFit="contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GalleryImage({
  src,
  alt,
  sizes,
  priority,
  className = "",
  transform,
  objectFit = "cover",
}: {
  src: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  transform?: Parameters<typeof getRoomImageSrc>[1];
  objectFit?: "cover" | "contain";
}) {
  const [error, setError] = useState(false);
  const finalSrc = error
    ? DEFAULT_ROOM_IMAGE_SRC
    : getRoomImageSrc(src, transform);

  return (
    <Image
      src={finalSrc}
      alt={alt}
      fill
      sizes={sizes}
      unoptimized
      priority={priority}
      className={`${objectFit === "contain" ? "object-contain" : "object-cover"} ${className}`}
      onError={() => setError(true)}
    />
  );
}
