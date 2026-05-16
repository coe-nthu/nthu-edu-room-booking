import { getDocumentDownloadContent } from "@/app/actions/document-downloads"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DocumentDownloadList } from "./document-download-list"

export default async function DownloadsPage() {
  const content = await getDocumentDownloadContent()

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">文件下載</h2>
        <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
          {content.body}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>可下載文件</CardTitle>
          <CardDescription>
            借用空間前可先下載相關表單、規範或附件。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentDownloadList files={content.files} />
        </CardContent>
      </Card>
    </div>
  )
}
