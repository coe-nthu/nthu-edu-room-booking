export const DEFAULT_ROOM_IMAGE_SRC = "/login_cover.jpg";
export const ROOM_IMAGES_BUCKET = "room-images";
export const MAX_ROOM_IMAGES = 10;

export function normalizeRoomImageList(
  imageUrls: unknown,
  primaryImageUrl?: string | null,
) {
  const urls = Array.isArray(imageUrls) ? imageUrls : [];
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const url of [...urls, primaryImageUrl]) {
    if (typeof url !== "string") continue;

    const trimmedUrl = url.trim();
    if (!trimmedUrl || seen.has(trimmedUrl)) continue;

    seen.add(trimmedUrl);
    normalized.push(trimmedUrl);

    if (normalized.length >= MAX_ROOM_IMAGES) break;
  }

  return normalized;
}

export function getPrimaryRoomImage(
  imageUrl: string | null | undefined,
  imageUrls: unknown,
) {
  const normalizedImages = normalizeRoomImageList(imageUrls, imageUrl);
  const normalizedPrimary = imageUrl?.trim();

  if (normalizedPrimary && normalizedImages.includes(normalizedPrimary)) {
    return normalizedPrimary;
  }

  return normalizedImages[0] ?? null;
}

export function getRoomImageCandidates(
  imageUrl: string | null | undefined,
  imageUrls: unknown,
) {
  const images = normalizeRoomImageList(imageUrls, imageUrl);
  const primaryImage = getPrimaryRoomImage(imageUrl, imageUrls);

  return primaryImage
    ? [primaryImage, ...images.filter((image) => image !== primaryImage)]
    : images;
}

export function getRoomGalleryImages(
  imageUrl: string | null | undefined,
  imageUrls: unknown,
) {
  const images = normalizeRoomImageList(imageUrls, imageUrl);
  const primaryImage = getPrimaryRoomImage(imageUrl, images);

  return {
    primaryImage,
    thumbnailImages: primaryImage
      ? images.filter((image) => image !== primaryImage)
      : images,
    images,
  };
}

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? null;
}

function encodeObjectPath(objectPath: string) {
  return objectPath.split("/").map(encodeURIComponent).join("/");
}

export function getRoomImageStoragePath(
  src: string | null | undefined,
  supabaseUrl = getSupabaseUrl(),
) {
  const trimmedSrc = src?.trim();

  if (!trimmedSrc || trimmedSrc.startsWith("/")) {
    return null;
  }

  const withoutBucketPrefix = trimmedSrc
    .replace(/^\/+/, "")
    .replace(/^room-images\//, "");

  if (!/^https?:\/\//i.test(trimmedSrc)) {
    return withoutBucketPrefix;
  }

  if (!supabaseUrl || !trimmedSrc.startsWith(`${supabaseUrl}/`)) {
    return null;
  }

  try {
    const url = new URL(trimmedSrc);
    const match = url.pathname.match(
      /^\/storage\/v1\/(?:object\/public|render\/image\/public)\/room-images\/(.+)$/,
    );

    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

export function getRoomImageSrc(src: string | null | undefined) {
  const trimmedSrc = src?.trim();

  if (!trimmedSrc) {
    return DEFAULT_ROOM_IMAGE_SRC;
  }

  if (trimmedSrc.startsWith("/")) {
    return trimmedSrc;
  }

  const supabaseUrl = getSupabaseUrl();
  const objectPath = getRoomImageStoragePath(trimmedSrc, supabaseUrl);

  if (!objectPath) {
    return /^https?:\/\//i.test(trimmedSrc)
      ? trimmedSrc
      : DEFAULT_ROOM_IMAGE_SRC;
  }

  if (!supabaseUrl) {
    return DEFAULT_ROOM_IMAGE_SRC;
  }

  const encodedPath = encodeObjectPath(objectPath);

  return `${supabaseUrl}/storage/v1/object/public/${ROOM_IMAGES_BUCKET}/${encodedPath}`;
}
