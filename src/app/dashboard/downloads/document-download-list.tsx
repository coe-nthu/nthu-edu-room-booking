import { Download, Eye, FileText } from "lucide-react";

import type { DocumentDownloadFile } from "@/app/actions/document-downloads";
import { Button } from "@/components/ui/button";

type DocumentDownloadListProps = {
  files: DocumentDownloadFile[];
};

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentDownloadList({ files }: DocumentDownloadListProps) {
  if (files.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        目前尚無可下載文件。
      </div>
    );
  }

  return (
    <div className="divide-y rounded-md border">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 rounded-md bg-secondary p-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="break-words font-medium">{file.title}</p>
              <p className="text-xs text-muted-foreground">
                {file.file_name} · {formatFileSize(file.file_size)}
              </p>
            </div>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <a href={file.file_url} target="_blank" rel="noreferrer">
                <Eye className="mr-2 h-4 w-4" />
                預覽
              </a>
            </Button>
            <Button asChild className="w-full sm:w-auto">
              <a href={file.file_url} target="_blank" rel="noreferrer" download>
                <Download className="mr-2 h-4 w-4" />
                下載
              </a>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
