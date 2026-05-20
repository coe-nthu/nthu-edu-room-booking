export const DEFAULT_ROOM_IMAGE_SRC = "/login_cover.jpg";
export const ROOM_IMAGES_BUCKET = "room-images";

type RoomImageTransform = {
  width: number;
  height?: number;
  quality?: number;
  resize?: "cover" | "contain" | "fill";
};

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? null;
}

function encodeObjectPath(objectPath: string) {
  return objectPath.split("/").map(encodeURIComponent).join("/");
}

function getRoomImageObjectPath(src: string, supabaseUrl: string | null) {
  const withoutBucketPrefix = src
    .replace(/^\/+/, "")
    .replace(/^room-images\//, "");

  if (!/^https?:\/\//i.test(src)) {
    return withoutBucketPrefix;
  }

  if (!supabaseUrl || !src.startsWith(`${supabaseUrl}/`)) {
    return null;
  }

  try {
    const url = new URL(src);
    const match = url.pathname.match(
      /^\/storage\/v1\/(?:object\/public|render\/image\/public)\/room-images\/(.+)$/,
    );

    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

function getTransformParams(transform: RoomImageTransform) {
  const params = new URLSearchParams({
    width: String(transform.width),
    resize: transform.resize ?? "cover",
  });

  if (transform.height) {
    params.set("height", String(transform.height));
  }

  if (transform.quality) {
    params.set("quality", String(transform.quality));
  }

  return params;
}

export function getRoomImageSrc(
  src: string | null | undefined,
  transform?: RoomImageTransform,
) {
  const trimmedSrc = src?.trim();

  if (!trimmedSrc) {
    return DEFAULT_ROOM_IMAGE_SRC;
  }

  if (trimmedSrc.startsWith("/")) {
    return trimmedSrc;
  }

  const supabaseUrl = getSupabaseUrl();
  const objectPath = getRoomImageObjectPath(trimmedSrc, supabaseUrl);

  if (!objectPath) {
    return /^https?:\/\//i.test(trimmedSrc)
      ? trimmedSrc
      : DEFAULT_ROOM_IMAGE_SRC;
  }

  if (!supabaseUrl) {
    return DEFAULT_ROOM_IMAGE_SRC;
  }

  const encodedPath = encodeObjectPath(objectPath);

  if (transform) {
    return `${supabaseUrl}/storage/v1/render/image/public/${ROOM_IMAGES_BUCKET}/${encodedPath}?${getTransformParams(transform)}`;
  }

  return `${supabaseUrl}/storage/v1/object/public/${ROOM_IMAGES_BUCKET}/${encodedPath}`;
}
