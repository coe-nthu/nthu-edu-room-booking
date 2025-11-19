# 新教育大樓空間借用系統開發計畫

## 1. 技術架構 (Tech Stack)

- **Frontend Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **UI Components**: shadcn/ui + Tailwind CSS
- **State Management**: React Query (TanStack Query) or Server Actions
- **Database/Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Forms**: React Hook Form + Zod (Schema Validation)
- **Calendar/Date**: date-fns or date-fns-tz

## 2. 功能開發優先級 (Roadmap)

### Phase 1: Must-Have (MVP 核心)

解決最痛點：讓預約數位化，狀態可視化。

1.  **核心預約系統**

    -   使用者/管理員登入 (Supabase Auth)
    -   建立預約表單 (選擇空間、日期時間、事由)
    -   [資料庫] 設計 `bookings`, `rooms`, `profiles` 表結構

2.  **核心業務規則引擎**

    -   實作「一般使用者 >= 7 天前申請」限制
    -   實作「時間重疊 (Conflict)」檢查 (利用 Postgres Range Types 或 Overlap 查詢)

3.  **Timetable 可視化介面**

    -   日曆視圖 (週/日)
    -   狀態顏色區分 (灰色: 待審核, 綠: 已核准, 紅色: 審核拒絕)

4.  **人工審核後台**

    -   管理員列表視圖 (Pending Requests)
    -   核准/拒絕操作 (更新 DB 狀態)

### Phase 2: Should-Have (體驗優化)

-   [ ] 郵件通知系統 (Supabase Edge Functions 或 Trigger)
-   [ ] 使用者個人預約管理 (取消功能)
-   [ ] 空間詳細資訊頁 (設備清單)
-   [ ] 週期性預約 (Recurring)

### Phase 3: Could-Have (進階功能)

-   [ ] 行事曆整合 (Calendar Integration)
-   [ ] 數據分析看板

## 3. 資料庫設計草案 (Supabase SQL)

### auth.users (Supabase 內建)

- 處理登入註冊

### public.profiles (延伸使用者資料)

- id (PK, references auth.users.id), role (text: 'admin'/'user'), full_name, student_id

### public.rooms

- id (UUID), name, description, capacity, is_lunch_locked (bool), equipment (jsonb)

### public.bookings

- id (UUID), user_id (FK profiles.id), room_id (FK rooms.id), start_time (timestamptz), end_time (timestamptz), status (enum: pending, approved, rejected, cancelled), purpose, created_at

## 4. Next Steps

1.  初始化 Next.js 專案 `npx create-next-app@latest`
2.  安裝 shadcn/ui 及相關套件
3.  設定 Supabase 專案與環境變數
4. 