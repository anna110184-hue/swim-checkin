# 游泳課打卡系統 — 部署指南

## 1. 建立 Supabase 專案

1. 前往 https://supabase.com 建立免費帳號
2. 點 **New project**，輸入名稱（如 `swim-checkin`），選擇最近的 region
3. 等待專案建立完成

## 2. 建立資料庫 Schema

1. 在 Supabase 左側選 **SQL Editor**
2. 貼上 `supabase/schema.sql` 的內容，點 **Run**
3. 貼上 `supabase/seed.sql` 的內容，點 **Run**（插入初始學生資料）

## 3. 建立管理員帳號

1. 在 Supabase 左側選 **Authentication → Users**
2. 點 **Add user → Create new user**
3. 輸入你的 Email（如 `ann.rctaipei@gmail.com`）與密碼
4. 記住這組帳密，這是管理員後台的登入資訊

## 4. 取得 Supabase 金鑰

1. 左側選 **Project Settings → API**
2. 複製：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`（保密，不要公開）

## 5. 本地開發

```bash
# 複製環境變數範本
cp .env.local.example .env.local
# 填入上方三個值後：

npm install
npm run dev
# 開啟 http://localhost:3000
```

## 6. 部署到 Vercel

### 方法 A：GitHub 匯入（推薦）

1. 將此資料夾推送到 GitHub repo
2. 前往 https://vercel.com → **Add New Project**
3. 選擇你的 repo，點 **Import**
4. 在 **Environment Variables** 填入三個環境變數：
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   NEXT_PUBLIC_SITE_URL=https://你的-vercel-網址.vercel.app
   ```
5. 點 **Deploy**

### 方法 B：Vercel CLI

```bash
npm i -g vercel
vercel
# 按照提示操作，記得在 Vercel dashboard 設定環境變數
```

## 7. 設定 Supabase Auth Redirect URLs

1. Supabase → **Authentication → URL Configuration**
2. **Site URL** 填入你的 Vercel 網址（如 `https://swim-checkin.vercel.app`）
3. **Redirect URLs** 新增：
   - `https://swim-checkin.vercel.app/admin`
   - `http://localhost:3000/admin`（本地開發用）

## 8. 完成！

- **家長打卡頁面**：`https://你的網址.vercel.app`
- **管理員後台**：`https://你的網址.vercel.app/admin`

---

## 資料夾結構

```
├── app/
│   ├── page.tsx              # 家長端首頁（今日課程）
│   ├── admin/
│   │   ├── layout.tsx        # 後台導覽列
│   │   ├── page.tsx          # 後台首頁
│   │   ├── login/page.tsx    # 登入頁
│   │   ├── AdminDashboard.tsx
│   │   ├── StudentManageTable.tsx
│   │   ├── AttendanceTab.tsx
│   │   └── MonthlyStats.tsx
│   └── api/
│       ├── checkin/          # 打卡 API
│       ├── cancel-checkin/   # 取消打卡 API
│       ├── students/         # 學生列表 API
│       ├── admin/
│       │   ├── students/     # 管理員學生 CRUD
│       │   └── checkin/      # 管理員代補打卡
│       └── auth/logout/      # 登出
├── components/
│   ├── StudentCard.tsx       # 學生打卡卡片
│   └── ProgressBar.tsx       # 10堂進度條
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # 瀏覽器端 Supabase client
│   │   ├── server.ts         # 伺服器端 Supabase client
│   │   └── types.ts          # TypeScript 型別定義
│   └── utils.ts              # 工具函式
├── middleware.ts              # 管理員路由保護
└── supabase/
    ├── schema.sql             # 資料庫 Schema
    └── seed.sql               # 初始學生資料
```

## 未來擴充：Resend Email 通知

`students` table 已預留 `parent_email` 欄位。
接 Resend 時，在打卡 API 中加入呼叫即可：

```ts
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);
await resend.emails.send({ to: parentEmail, subject: "今日未打卡提醒", ... });
```
