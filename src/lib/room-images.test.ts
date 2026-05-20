import { afterEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_ROOM_IMAGE_SRC, getRoomImageSrc } from "@/lib/room-images";

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
});
