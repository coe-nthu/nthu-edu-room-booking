"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Room } from "@/utils/supabase/queries";
import {
  getPrimaryRoomImage,
  getRoomImageStoragePath,
  normalizeRoomImageList,
  ROOM_IMAGES_BUCKET,
} from "@/lib/room-images";

// Check if user is admin
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Forbidden: Admin access required");
  }

  return supabase;
}

export async function createRoom(data: Partial<Room>) {
  const supabase = await requireAdmin();
  const imageUrls = normalizeRoomImageList(data.image_urls, data.image_url);
  const primaryImageUrl = getPrimaryRoomImage(data.image_url, imageUrls);

  const { error } = await supabase.from("rooms").insert({
    name: data.name,
    room_code: data.room_code,
    capacity: data.capacity,
    floor: data.floor,
    room_type: data.room_type,
    equipment: data.equipment || [],
    unavailable_periods: data.unavailable_periods || [],
    image_url: primaryImageUrl,
    image_urls: imageUrls,
    is_active: data.is_active ?? true,
    allow_noon: data.allow_noon ?? false,
    admin_only: data.admin_only ?? false,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/admin/rooms");
  revalidatePath("/dashboard/spaces");
}

export async function updateRoom(id: string, data: Partial<Room>) {
  const supabase = await requireAdmin();
  const imageUrls = normalizeRoomImageList(data.image_urls, data.image_url);
  const primaryImageUrl = getPrimaryRoomImage(data.image_url, imageUrls);

  const { error } = await supabase
    .from("rooms")
    .update({
      name: data.name,
      room_code: data.room_code,
      capacity: data.capacity,
      floor: data.floor,
      room_type: data.room_type,
      equipment: data.equipment,
      unavailable_periods: data.unavailable_periods,
      image_url: primaryImageUrl,
      image_urls: imageUrls,
      allow_noon: data.allow_noon,
      admin_only: data.admin_only,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/admin/rooms");
  revalidatePath("/dashboard/spaces");
  revalidatePath(`/dashboard/spaces/${id}`);
}

export async function toggleRoomStatus(id: string, isActive: boolean) {
  const supabase = await requireAdmin();

  const { error } = await supabase
    .from("rooms")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/admin/rooms");
  revalidatePath("/dashboard/spaces");
}

export async function deleteRoomImage(imageUrl: string, roomId?: string) {
  const supabase = await requireAdmin();
  const trimmedImageUrl = imageUrl.trim();
  if (!trimmedImageUrl) throw new Error("No image URL provided");

  let nextImageUrls: string[] | null = null;
  let nextPrimaryImageUrl: string | null = null;

  if (roomId) {
    const { data: room, error: fetchError } = await supabase
      .from("rooms")
      .select("image_url, image_urls")
      .eq("id", roomId)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    const currentImages = normalizeRoomImageList(
      room?.image_urls,
      room?.image_url,
    );
    nextImageUrls = currentImages.filter((url) => url !== trimmedImageUrl);
    nextPrimaryImageUrl =
      room?.image_url === trimmedImageUrl
        ? (nextImageUrls[0] ?? null)
        : getPrimaryRoomImage(room?.image_url, nextImageUrls);
  }

  const objectPath = getRoomImageStoragePath(trimmedImageUrl);

  if (objectPath) {
    const { error: removeError } = await supabase.storage
      .from(ROOM_IMAGES_BUCKET)
      .remove([objectPath]);

    if (removeError) throw new Error(removeError.message);
  }

  if (roomId && nextImageUrls) {
    const { error: updateError } = await supabase
      .from("rooms")
      .update({
        image_url: nextPrimaryImageUrl,
        image_urls: nextImageUrls,
      })
      .eq("id", roomId);

    if (updateError) throw new Error(updateError.message);

    revalidatePath("/dashboard/admin/rooms");
    revalidatePath("/dashboard/spaces");
    revalidatePath(`/dashboard/spaces/${roomId}`);
  }

  return {
    image_url: nextPrimaryImageUrl,
    image_urls: nextImageUrls,
  };
}

export async function uploadRoomImage(formData: FormData): Promise<string> {
  const supabase = await requireAdmin();

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const rawFileExt = file.name.split(".").pop() ?? "jpg";
  const fileExt = rawFileExt.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt || "jpg"}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(ROOM_IMAGES_BUCKET)
    .upload(filePath, file);

  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from(ROOM_IMAGES_BUCKET).getPublicUrl(filePath);

  return publicUrl;
}
