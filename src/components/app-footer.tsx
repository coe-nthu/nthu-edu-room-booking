import Link from "next/link"
import { Separator } from "@/components/ui/separator"

export function AppFooter() {
  return (
    <footer className="border-t bg-muted/50 mt-auto">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* 主要內容區 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* 第一區：聯絡資訊 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">聯絡資訊</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                國立清華大學 竹師教育學院
              </p>
              <p className="text-xs text-muted-foreground">
                NTHU College of Education
              </p>
              <div className="space-y-1 pt-2">
                <p>
                  <span className="font-medium">地址：</span>
                  <br />
                  30014 新竹市南大路 521 號 (南大校區)
                </p>
                <p>
                  <span className="font-medium">電話：</span>
                  <br />
                  (03) 571-5131 轉 [分機號碼]
                </p>
                <p>
                  <span className="font-medium">公務信箱：</span>
                  <br />
                  <a
                    href="mailto:admin_office@nthu.edu.tw"
                    className="text-primary hover:underline"
                  >
                    admin_office@nthu.edu.tw
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* 第二區：快速連結 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">快速連結</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/dashboard/rules"
                  className="text-muted-foreground hover:text-foreground hover:underline transition-colors"
                >
                  借用管理辦法/規範
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground cursor-not-allowed">
                  空間配置圖
                </span>
                <span className="text-xs text-muted-foreground block mt-1">
                  (連結待設定)
                </span>
              </li>
              <li>
                <span className="text-muted-foreground cursor-not-allowed">
                  常見問題 (FAQ)
                </span>
                <span className="text-xs text-muted-foreground block mt-1">
                  (頁面待建立)
                </span>
              </li>
              <li>
                <a
                  href="https://coedu.site.nthu.edu.tw/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground hover:underline transition-colors"
                >
                  學院官方網站
                </a>
              </li>
              <li>
                <Link
                  href="/dashboard/admin"
                  className="text-muted-foreground hover:text-foreground hover:underline transition-colors"
                >
                  管理員登入
                </Link>
              </li>
            </ul>
          </div>

          {/* 第三區：系統支援 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">系統支援</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="mailto:admin_office@nthu.edu.tw?subject=系統問題回報"
                  className="text-muted-foreground hover:text-foreground hover:underline transition-colors"
                >
                  系統問題回報
                </a>
                <span className="text-xs text-muted-foreground block mt-1">
                  (網頁操作問題請點此)
                </span>
              </li>
              <li>
                <span className="text-muted-foreground cursor-not-allowed">
                  最新公告
                </span>
                <span className="text-xs text-muted-foreground block mt-1">
                  (功能待建立)
                </span>
              </li>
              <li>
                <p className="text-muted-foreground">
                  開發團隊：
                  <br />
                  <span className="text-xs">
                    系統開發：清大資工
                  </span>
                </p>
              </li>
            </ul>
          </div>

          {/* 額外資訊區 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">關於系統</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                本系統提供竹師教育學院空間借用服務，讓您輕鬆管理空間預約申請。
              </p>
              <p className="text-xs pt-2">
                系統版本：<span className="font-mono">Ver 1.0.0</span>
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* 底部版權區 */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="text-center md:text-left">
            <p>
              © 2025 國立清華大學 竹師教育學院 (NTHU College of Education).
              All Rights Reserved.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 justify-center md:justify-end">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground cursor-not-allowed">
                隱私權政策
              </span>
              <span className="text-xs text-muted-foreground">
                (頁面待建立)
              </span>
            </div>
            <span className="text-xs font-mono">Ver 1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

