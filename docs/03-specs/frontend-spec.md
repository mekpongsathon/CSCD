# Frontend Specification

## Overview

Frontend เขียนด้วย **Next.js 16** (App Router) + **TypeScript** + **TailwindCSS**  
Design System อ้างอิงจาก Cohere.com (ดูรายละเอียดใน `01-overview/design-system.md`)

---

## Pages

| Route | Component | หน้าที่ |
|-------|-----------|--------|
| `/` | `Dashboard` | แสดง stats และรายการ analysis jobs ทั้งหมด |
| `/jobs/:id` | `JobDetailView` | แสดงผลการวิเคราะห์ + Monaco Diff |
| `/repositories` | `RepositoriesView` | จัดการ repositories ที่ monitor |

---

## Components

### `Nav`
- Top navigation bar แบบ sticky
- Announcement bar ด้านบน (dark band)
- Logo + nav links + CTA button

### `Dashboard`
- Stats cards: Total / Completed / Running / Failed
- ตาราง jobs แบบ rule-separated list
- Auto-refresh ทุก 5 วินาที (SWR `refreshInterval`)
- Empty state เมื่อไม่มี jobs

### `JobDetailView`
- Header: branch name, PR number, status badge, created date
- Stats cards: Total findings / Critical / Frontend / Backend
- Filter chips: All / Frontend / Backend
- Findings list (คลิกเลือกเพื่อดู diff)
- Monaco Diff Editor panel (side-by-side)
- Auto-refresh ทุก 3 วินาที ขณะ job ยัง running

### `CodeCompare`
- Monaco `DiffEditor` (lazy-loaded, ไม่ SSR)
- Header: ชื่อไฟล์ + severity badge + similarity score
- แสดง existing file (original) vs new file (modified)
- Language detection อัตโนมัติจาก file extension

### `StatusBadge`
| Status | สี | Label |
|--------|-----|-------|
| pending | Stone/Gray | Pending |
| running | Pale Blue | Running |
| completed | Pale Green | Completed |
| failed | Red | Failed |

### `SeverityBadge`
| Severity | สี | Label |
|----------|-----|-------|
| critical | Red | Critical |
| warning | Yellow | Warning |
| info | Blue | Info |

---

## Data Fetching

ใช้ **SWR** สำหรับ client-side fetching ทั้งหมด

```ts
// ตัวอย่าง
const { data: jobs } = useSWR("jobs", () => api.jobs.list(), {
  refreshInterval: 5000,
});
```

API client อยู่ที่ `src/lib/api.ts` — wrapper บน native `fetch`

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | Backend API URL |

---

## Project Structure

```
apps/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Dashboard page
│   │   ├── globals.css            # TailwindCSS + custom classes
│   │   ├── jobs/[id]/page.tsx     # Job detail page
│   │   └── repositories/page.tsx  # Repositories page
│   ├── components/
│   │   ├── Nav.tsx
│   │   ├── Dashboard.tsx
│   │   ├── JobDetailView.tsx
│   │   ├── CodeCompare.tsx
│   │   ├── RepositoriesView.tsx
│   │   ├── StatusBadge.tsx
│   │   └── SeverityBadge.tsx
│   ├── lib/
│   │   ├── api.ts                 # API client
│   │   └── utils.ts               # cn(), formatDate(), getSeverityLabel()
│   └── types/
│       └── index.ts               # TypeScript interfaces
├── tailwind.config.ts             # Design tokens จาก design.md
├── next.config.mjs
└── package.json
```

---

## Running

```bash
cd apps/web
npm install
npm run dev        # http://localhost:3000
npm run build      # Production build
npm run type-check # TypeScript check
```
