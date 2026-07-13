# 游泳打卡系統 — 金流 & 代課功能規劃 v4

> 決策記錄（2026-07-13）：
> - **有上課才繳錢**：打卡（含代課）＝產生該堂付款；缺課沒打卡＝不繳、進度不動
> - 金流：**家長每週 PayID 轉給收款人（Ann）→ Ann 每週彙總一筆轉給老師**
> - Ann＝收款人＝管理員，確認動作直接在現有 admin 後台做，**不需要老師帳號**
> - 缺課由家長自行找人代上（記代課者名字），代課週照扣進度、照繳錢
> - Trial 與 regular **同價**
> - ~~補課券 / 請假 / 時段容量 / 老師確認頁~~ → 不做

---

## Phase 1：代課打卡（小改動）

### 資料庫變更（supabase/migrations/001_substitute.sql）

```sql
alter table attendance add column substitute_name text;
```

### 業務規則

| 情境 | 進度 | 付款 |
|---|---|---|
| 正常出席打卡 | +1 | 產生本堂付款 |
| 找人代上（打卡填代課者名字） | +1 | 產生本堂付款（媽媽繳，和代課者私下結算） |
| 缺課沒打卡 | 不動 | 不產生付款 |

### UI / API 變更

- **StudentCard**：打卡按鈕旁加「找人代上」→ 填名字 → 顯示「本週由 ○○ 代上 ✓」
- **Admin AttendanceTab**：出席記錄標示代課者（例如「6/10 ○○代」）
- `POST /api/checkin` 加 `substitute_name` 可選參數；取消打卡時一併刪除未確認付款

---

## Phase 2：打卡即付款（家長 → Ann）

### 資料庫變更（002_payments.sql）

```sql
create table payments (
  id            uuid primary key default uuid_generate_v4(),
  student_id    uuid not null references students(id) on delete cascade,
  session_id    uuid not null references sessions(id) on delete cascade,
  attendance_id uuid not null references attendance(id) on delete cascade,
  amount        numeric(10,2) not null,
  status        text not null default 'pending'
                check (status in ('pending','claimed','confirmed')),
  receipt_url   text,                   -- 轉帳截圖（可選）
  claimed_at    timestamptz,            -- 家長按「我已轉帳」
  confirmed_at  timestamptz,            -- Ann 確認入帳
  payout_id     uuid,                   -- 屬於哪一筆匯給老師的款（下方 payouts）
  created_at    timestamptz not null default now(),
  unique (attendance_id)
);

-- Ann → 老師 的每週彙總匯款
create table payouts (
  id           uuid primary key default uuid_generate_v4(),
  week_start   date not null,
  week_end     date not null,
  total_amount numeric(10,2) not null,
  status       text not null default 'pending'
               check (status in ('pending','transferred')),
  transferred_at timestamptz,
  note         text,
  created_at   timestamptz not null default now()
);

-- 每堂課金額（trial 同價，所以一個全域設定即可；保留彈性放 settings）
create table settings (
  key   text primary key,
  value text not null
);
-- 例：insert into settings values ('price_per_lesson', '25'), ('collector_payid', 'Ann 的 PayID');
```

### 流程

**家長端：**
1. 打卡成功 → 自動產生 `pending` 付款
2. 付款卡片顯示：Ann 的 PayID + 金額 + 「我已轉帳」（可附截圖）→ status='claimed'
3. 繳費進度顯示「已繳 6 堂 / 已上 7 堂」，未繳提醒

**Ann 端（admin 後台新增「金流」tab）：**
4. 「待確認」清單：核對銀行入帳 → 按確認 → status='confirmed'
5. 每週日系統彙總本週 confirmed 總額 → 產生一筆 payout → Ann 一筆轉給老師 → 按「已匯出」
6. 所有紀錄可回溯：哪堂課、誰繳的、哪筆 payout，帳目透明，換收款人也交接得清楚

---

## Phase 3：每週自動對帳報表（Cron + Resend）

- **Vercel Cron**：每週日 20:00 → `GET /api/cron/weekly-report`（CRON_SECRET 保護）
- 自動產生本週 payout（pending）+ 寄報表：
  - 給 **Ann**：本週出席（含代課）、已確認/待確認/未繳名單、應匯老師總額
  - 給 **老師**：本週出席名單 + 「Ann 將匯款 $X」
- 環境變數：`RESEND_API_KEY`、`CRON_SECRET`、`TEACHER_EMAIL`

---

## 施工順序 & 預估

| Phase | 內容 | 規模 |
|---|---|---|
| 1 | 代課打卡 | 小，2-3 個檔案 |
| 2 | 打卡即付款 + admin 金流 tab + payouts | 中，5-6 個檔案 |
| 3 | 週報 cron + 自動產生 payout | 小，1-2 個檔案 |

## 待確認事項

- [x] Ann 的收款 PayID：0423780409
- [x] 每堂課金額：$45（trial 同價）
- [ ] 老師的 email（收週報用）— 之後補

## 進度

- [x] Phase 1 代課打卡 — 完成（2026-07-13）
- [ ] Phase 2 打卡即付款 + admin 金流 tab
- [ ] Phase 3 週報 cron
