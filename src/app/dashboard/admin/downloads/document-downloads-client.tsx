"use client";

import { useRef, useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import type {
  DocumentDownloadContent,
  DocumentDownloadFile,
} from "@/app/actions/document-downloads";
import {
  deleteDocumentDownloadFile,
  updateDocumentDownloadFile,
  updateDocumentDownloadText,
  uploadDocumentDownloadFile,
} from "@/app/actions/document-downloads";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type DocumentDownloadsClientProps = {
  initialContent: DocumentDownloadContent;
};

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentDownloadsClient({
  initialContent,
}: DocumentDownloadsClientProps) {
  const [body, setBody] = useState(initialContent.body);
  const [files, setFiles] = useState<DocumentDownloadFile[]>(
    initialContent.files,
  );
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [savingText, setSavingText] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [updatingFileId, setUpdatingFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveText = async () => {
    setSavingText(true);
    try {
      await updateDocumentDownloadText(body);
      toast.success("頁面文字已更新");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更新失敗");
    } finally {
      setSavingText(false);
    }
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedFile) {
      toast.error("請選擇檔案");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", title);
      const uploadedFile = await uploadDocumentDownloadFile(formData);
      toast.success("文件已上傳");
      setFiles((currentFiles) => [uploadedFile, ...currentFiles]);
      setTitle("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "上傳失敗");
    } finally {
      setUploading(false);
    }
  };

  const handleToggleVisible = async (file: DocumentDownloadFile) => {
    setUpdatingFileId(file.id);
    try {
      await updateDocumentDownloadFile(file.id, {
        is_visible: !file.is_visible,
      });
      setFiles((currentFiles) =>
        currentFiles.map((item) =>
          item.id === file.id
            ? { ...item, is_visible: !file.is_visible }
            : item,
        ),
      );
      toast.success(file.is_visible ? "已隱藏文件" : "已公開文件");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更新失敗");
    } finally {
      setUpdatingFileId(null);
    }
  };

  const handleRename = async (
    file: DocumentDownloadFile,
    nextTitle: string,
  ) => {
    const trimmedTitle = nextTitle.trim();
    if (!trimmedTitle || trimmedTitle === file.title) return;

    setUpdatingFileId(file.id);
    try {
      await updateDocumentDownloadFile(file.id, { title: trimmedTitle });
      setFiles((currentFiles) =>
        currentFiles.map((item) =>
          item.id === file.id ? { ...item, title: trimmedTitle } : item,
        ),
      );
      toast.success("文件名稱已更新");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更新失敗");
    } finally {
      setUpdatingFileId(null);
    }
  };

  const handleDelete = async (file: DocumentDownloadFile) => {
    const confirmed = window.confirm(`確定要刪除「${file.title}」嗎？`);
    if (!confirmed) return;

    setUpdatingFileId(file.id);
    try {
      await deleteDocumentDownloadFile(file.id);
      setFiles((currentFiles) =>
        currentFiles.filter((item) => item.id !== file.id),
      );
      toast.success("文件已刪除");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "刪除失敗");
    } finally {
      setUpdatingFileId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>頁面文字</CardTitle>
          <CardDescription>
            這段文字會顯示在公開「文件下載」頁面標題下方。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={5}
            placeholder="輸入文件下載頁面說明..."
          />
          <Button onClick={handleSaveText} disabled={savingText}>
            {savingText ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            儲存文字
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>上傳文件</CardTitle>
          <CardDescription>
            上傳後會立即出現在公開下載列表中，未登入訪客也能查看與下載。單檔上限
            50 MB。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleUpload}
            className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
          >
            <div className="space-y-2">
              <Label htmlFor="document-title">顯示名稱</Label>
              <Input
                id="document-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="留空則使用原始檔名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document-file">檔案</Label>
              <Input
                id="document-file"
                ref={fileInputRef}
                type="file"
                onChange={(event) =>
                  setSelectedFile(event.target.files?.[0] || null)
                }
              />
            </div>
            <Button type="submit" disabled={uploading}>
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              上傳
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>文件列表</CardTitle>
          <CardDescription>
            可重新命名、隱藏或刪除已上傳的文件。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {files.length > 0 ? (
            <div className="divide-y rounded-md border">
              {files.map((file) => {
                const isUpdating = updatingFileId === file.id;

                return (
                  <div key={file.id} className="space-y-3 p-4">
                    <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                      <div className="space-y-2">
                        <Label htmlFor={`file-title-${file.id}`}>
                          顯示名稱
                        </Label>
                        <Input
                          id={`file-title-${file.id}`}
                          defaultValue={file.title}
                          onBlur={(event) =>
                            handleRename(file, event.target.value)
                          }
                          disabled={isUpdating}
                        />
                        <p className="text-xs text-muted-foreground">
                          {file.file_name} · {formatFileSize(file.file_size)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm">
                          <a
                            href={file.file_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            預覽
                          </a>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleVisible(file)}
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : file.is_visible ? (
                            <EyeOff className="mr-2 h-4 w-4" />
                          ) : (
                            <Eye className="mr-2 h-4 w-4" />
                          )}
                          {file.is_visible ? "隱藏" : "公開"}
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(file)}
                          disabled={isUpdating}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          刪除
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              目前尚未上傳文件。
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
