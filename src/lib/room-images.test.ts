import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_ROOM_IMAGE_SRC,
  getPrimaryRoomImage,
  getRoomGalleryImages,
  getRoomImageSrc,
  getRoomImageStoragePath,
  MAX_ROOM_IMAGES,
  normalizeRoomImageList,
} from "@/lib/room-images";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getRoomImageSrc", () => {
  it("keeps absolute and local image sources as-is", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co/");

    expect(getRoomImageSrc("https://cdn.example.com/room.jpg")).toBe(
      "https://cdn.example.com/room.jpg",
    );
    expect(
      getRoomImageSrc("https://cdn.example.com/room.jpg", { width: 160 }),
    ).toBe("https://cdn.example.com/room.jpg");
    expect(getRoomImageSrc("https://example.com/room.jpg")).toBe(
      "https://example.com/room.jpg",
    );
    expect(getRoomImageSrc("/room.jpg")).toBe("/room.jpg");
  });

  it("falls back when no image source exists", () => {
    expect(getRoomImageSrc(null)).toBe(DEFAULT_ROOM_IMAGE_SRC);
    expect(getRoomImageSrc("   ")).toBe(DEFAULT_ROOM_IMAGE_SRC);
  });

  it("turns Supabase storage object paths into public room-image URLs", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co/");

    expect(getRoomImageSrc("room-images/floor 1.jpg")).toBe(
      "https://example.supabase.co/storage/v1/object/public/room-images/floor%201.jpg",
    );
  });

  it("can request a transformed Supabase thumbnail from object paths", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co/");

    expect(
      getRoomImageSrc("room-images/floor 1.jpg", {
        width: 160,
        height: 100,
        quality: 60,
      }),
    ).toBe(
      "https://example.supabase.co/storage/v1/render/image/public/room-images/floor%201.jpg?width=160&resize=cover&height=100&quality=60",
    );
  });

  it("can request a transformed Supabase thumbnail from stored public URLs", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co/");

    expect(
      getRoomImageSrc(
        "https://example.supabase.co/storage/v1/object/public/room-images/floor%201.jpg",
        { width: 160, height: 100, quality: 60 },
      ),
    ).toBe(
      "https://example.supabase.co/storage/v1/render/image/public/room-images/floor%201.jpg?width=160&resize=cover&height=100&quality=60",
    );
  });

  it("extracts Supabase storage object paths for deletion", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co/");

    expect(getRoomImageStoragePath("room-images/floor 1.jpg")).toBe(
      "floor 1.jpg",
    );
    expect(
      getRoomImageStoragePath(
        "https://example.supabase.co/storage/v1/object/public/room-images/floor%201.jpg",
      ),
    ).toBe("floor 1.jpg");
    expect(getRoomImageStoragePath("/login_cover.jpg")).toBeNull();
    expect(getRoomImageStoragePath("https://cdn.example.com/room.jpg")).toBeNull();
  });
});

describe("room image gallery helpers", () => {
  it("normalizes gallery images by trimming, deduping, and limiting to 10", () => {
    const images = Array.from({ length: 12 }, (_, index) => `room-${index}.jpg`);

    expect(
      normalizeRoomImageList([" room-0.jpg ", "", "room-1.jpg", ...images]),
    ).toEqual(images.slice(0, MAX_ROOM_IMAGES));
  });

  it("includes the legacy primary image when the gallery is empty", () => {
    expect(normalizeRoomImageList(null, "cover.jpg")).toEqual(["cover.jpg"]);
  });

  it("uses the selected primary image when it belongs to the gallery", () => {
    expect(
      getPrimaryRoomImage("secondary.jpg", ["primary.jpg", "secondary.jpg"]),
    ).toBe("secondary.jpg");
  });

  it("keeps the selected primary image when normalizing stale gallery data", () => {
    expect(getPrimaryRoomImage("missing.jpg", ["primary.jpg"])).toBe(
      "missing.jpg",
    );
  });

  it("splits primary and thumbnail images for the borrowing page", () => {
    expect(
      getRoomGalleryImages("cover.jpg", ["cover.jpg", "side.jpg", "back.jpg"]),
    ).toEqual({
      primaryImage: "cover.jpg",
      thumbnailImages: ["side.jpg", "back.jpg"],
      images: ["cover.jpg", "side.jpg", "back.jpg"],
    });
  });
});
