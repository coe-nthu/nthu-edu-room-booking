"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";

export type DocumentDownloadFile = {
  id: string;
  title: string;
  file_name: string;
  file_path: string;
  file_url: string;
  file_size: number;
  mime_type: string | null;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type DocumentDownloadContent = {
  body: string;
  files: DocumentDownloadFile[];
};

const SETTINGS_ID = true;
const DOWNLOAD_BUCKET = "document-downloads";

function getSafeStoragePath(fileName: string) {
  const extension = fileName
    .split(".")
    .pop()
    ?.replace(/[^A-Za-z0-9]/g, "")
    .toLowerCase();
  const suffix = extension ? `.${extension}` : "";

  return `${Date.now()}-${crypto.randomUUID()}${suffix}`;
}

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

  return { supabase, user };
}

function revalidateDownloadPages() {
  revalidatePath("/dashboard/downloads");
  revalidatePath("/dashboard/admin/downloads");
}

export async function getDocumentDownloadContent(): Promise<DocumentDownloadContent> {
  const supabase = await createClient();

  const [settingsResult, filesResult] = await Promise.all([
    supabase
      .from("document_download_settings")
      .select("body")
      .eq("id", SETTINGS_ID)
      .maybeSingle(),
    supabase
      .from("document_download_files")
      .select("*")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
  ]);

  if (settingsResult.error) {
    console.error(
      "Error fetching document download settings:",
      settingsResult.error,
    );
  }

  if (filesResult.error) {
    console.error("Error fetching document download files:", filesResult.error);
  }

  return {
    body: settingsResult.data?.body || "請下載並參考下方文件。",
    files: (filesResult.data || []) as DocumentDownloadFile[],
  };
}

export async function getAdminDocumentDownloadContent(): Promise<DocumentDownloadContent> {
  const { supabase } = await requireAdmin();

  const [settingsResult, filesResult] = await Promise.all([
    supabase
      .from("document_download_settings")
      .select("body")
      .eq("id", SETTINGS_ID)
      .maybeSingle(),
    supabase
      .from("document_download_files")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
  ]);

  if (settingsResult.error) throw new Error(settingsResult.error.message);
  if (filesResult.error) throw new Error(filesResult.error.message);

  return {
    body: settingsResult.data?.body || "請下載並參考下方文件。",
    files: (filesResult.data || []) as DocumentDownloadFile[],
  };
}

export async function updateDocumentDownloadText(body: string) {
  const { supabase } = await requireAdmin();
  const trimmedBody = body.trim();

  if (!trimmedBody) {
    throw new Error("頁面文字不可為空");
  }

  const { error } = await supabase.from("document_download_settings").upsert({
    id: SETTINGS_ID,
    body: trimmedBody,
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);

  revalidateDownloadPages();
}

export async function uploadDocumentDownloadFile(
  formData: FormData,
): Promise<DocumentDownloadFile> {
  const { supabase, user } = await requireAdmin();

  const file = formData.get("file") as File | null;
  const title = String(formData.get("title") || "").trim();

  if (!file || file.size === 0) {
    throw new Error("請選擇檔案");
  }

  const displayTitle = title || file.name;
  const filePath = getSafeStoragePath(file.name);

  const { error: uploadError } = await supabase.storage
    .from(DOWNLOAD_BUCKET)
    .upload(filePath, file);

  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from(DOWNLOAD_BUCKET).getPublicUrl(filePath);

  const { data: insertedFile, error: insertError } = await supabase
    .from("document_download_files")
    .insert({
      title: displayTitle,
      file_name: file.name,
      file_path: filePath,
      file_url: publicUrl,
      file_size: file.size,
      mime_type: file.type || null,
      uploaded_by: user.id,
    })
    .select("*")
    .single();

  if (insertError) {
    await supabase.storage.from(DOWNLOAD_BUCKET).remove([filePath]);
    throw new Error(insertError.message);
  }

  revalidateDownloadPages();

  return insertedFile as DocumentDownloadFile;
}

export async function updateDocumentDownloadFile(
  id: string,
  updates: { title?: string; is_visible?: boolean; sort_order?: number },
) {
  const { supabase } = await requireAdmin();
  const nextUpdates: {
    title?: string;
    is_visible?: boolean;
    sort_order?: number;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (updates.title !== undefined) {
    const title = updates.title.trim();
    if (!title) throw new Error("文件名稱不可為空");
    nextUpdates.title = title;
  }

  if (updates.is_visible !== undefined) {
    nextUpdates.is_visible = updates.is_visible;
  }

  if (updates.sort_order !== undefined) {
    nextUpdates.sort_order = updates.sort_order;
  }

  const { error } = await supabase
    .from("document_download_files")
    .update(nextUpdates)
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidateDownloadPages();
}

export async function deleteDocumentDownloadFile(id: string) {
  const { supabase } = await requireAdmin();

  const { data: file, error: fetchError } = await supabase
    .from("document_download_files")
    .select("file_path")
    .eq("id", id)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const { error: deleteError } = await supabase
    .from("document_download_files")
    .delete()
    .eq("id", id);

  if (deleteError) throw new Error(deleteError.message);

  if (file?.file_path) {
    const { error: removeError } = await supabase.storage
      .from(DOWNLOAD_BUCKET)
      .remove([file.file_path]);

    if (removeError) {
      console.error("Error removing document download file:", removeError);
    }
  }

  revalidateDownloadPages();
}
