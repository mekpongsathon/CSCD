# Analysis Workflow

## Full End-to-End Flow

---

## Step 1 — Developer opens Pull Request

**เครื่องมือ:** GitHub

- Developer สร้าง branch ใหม่จาก `main`
- เขียนโค้ด → push branch → เปิด Pull Request
- GitHub ส่ง webhook event `pull_request` (opened / synchronize)

---

## Step 2 — GitHub Action triggers

**เครื่องมือ:** GitHub Actions Runner (Ubuntu)  
**ไฟล์:** `.github/workflows/code-duplication-analysis.yml`

```yaml
on:
  pull_request:
    types: [opened, synchronize]
```

Action ทำงานตามลำดับ:
1. `actions/checkout@v4` — checkout โค้ดพร้อม full git history (`fetch-depth: 0`)
2. `actions/setup-go@v5` — ติดตั้ง Go 1.22
3. Build analyzer binary จาก `apps/analyzer/`

---

## Step 3 — Create Analysis Job

**เครื่องมือ:** HTTP (curl) → Go Fiber API → PostgreSQL

Action เรียก API:
```
POST /api/v1/analyze
{
  "repository_url": "https://github.com/owner/repo",
  "branch_name": "feature/my-branch",
  "pull_request_number": 42,
  "base_branch": "main"
}
```

API สร้าง record ใน `analysis_jobs` สถานะ `pending` แล้วคืน `job_id`

---

## Step 4 — Run Analyzer Engine

**เครื่องมือ:** Go Binary (`apps/analyzer/`)

```bash
./analyzer \
  --repo "$GITHUB_WORKSPACE" \
  --base "origin/main" \
  --job-id "<job_id>" \
  --output analysis_report.json
```

### ขั้นตอนภายใน Analyzer

```
┌─────────────────────────────────────────────┐
│  Step 4.1 — Detect Changed Files            │
│  เครื่องมือ: git diff --diff-filter=AM      │
│  ผล: รายการไฟล์ที่ added/modified เท่านั้น  │
└───────────────────┬─────────────────────────┘
                    │
┌───────────────────▼─────────────────────────┐
│  Step 4.2 — Classify Files                  │
│  เครื่องมือ: File extension detection       │
│  Frontend: .ts .tsx .js .jsx                │
│  Backend:  .go .cs .java .py                │
└───────────────────┬─────────────────────────┘
                    │
┌───────────────────▼─────────────────────────┐
│  Step 4.3 — Normalize Code                  │
│  เครื่องมือ: Custom Go normalizer           │
│  ลบ: comments, blank lines, formatting      │
│  เหลือ: โครงสร้างตรรกะ                     │
└───────────────────┬─────────────────────────┘
                    │
┌───────────────────▼─────────────────────────┐
│  Step 4.4 — Generate Fingerprints           │
│  เครื่องมือ: Winnowing Algorithm (Go)       │
│  - Tokenize → k-grams → rolling hash        │
│  - เลือก minimum hash ในแต่ละ window        │
│  ผล: fingerprint set ([]uint64)             │
└───────────────────┬─────────────────────────┘
                    │
┌───────────────────▼─────────────────────────┐
│  Step 4.5 — Similarity Detection            │
│  เครื่องมือ: Jaccard Similarity (Go)        │
│  score = |intersection| / |union| × 100     │
│  เทียบกับทุกไฟล์ที่มีอยู่ใน repo           │
└───────────────────┬─────────────────────────┘
                    │
┌───────────────────▼─────────────────────────┐
│  Step 4.6 — Apply Severity Rules            │
│  ≥ 90% → critical                           │
│  ≥ 75% → warning                            │
│  ≥ 60% → info                               │
│  < 60% → ไม่รายงาน                         │
└───────────────────┬─────────────────────────┘
                    │
┌───────────────────▼─────────────────────────┐
│  Step 4.7 — Write Report                    │
│  เครื่องมือ: JSON file (analysis_report.json)│
└─────────────────────────────────────────────┘
```

### Minimum Threshold (ไม่วิเคราะห์ถ้าไฟล์เล็กเกินไป)
```
min_lines:  8
min_tokens: 20
```

### Ignore Patterns
```
dist/  build/  generated/  node_modules/
migrations/  vendor/  *.g.ts
```

---

## Step 5 — Store Results

**เครื่องมือ:** PostgreSQL

Analyzer บันทึกผลลงตาราง:
- `analysis_jobs` — update สถานะเป็น `completed` หรือ `failed`
- `analysis_results` — บันทึกแต่ละ finding พร้อม similarity score, severity, code snippet

---

## Step 6 — Comment on PR

**เครื่องมือ:** `actions/github-script@v7` → GitHub REST API

```
⚠ CSCD2 — Code Duplication Analysis

Branch: `feature/my-branch`

| Metric          | Count |
|-----------------|-------|
| Total Findings  | 3     |
| Critical (≥90%) | 1     |

View Full Report → http://your-dashboard/jobs/<job_id>
```

---

## Step 7 — View Dashboard

**เครื่องมือ:** Next.js 16, React, SWR, Monaco Editor

| หน้า | URL | เนื้อหา |
|------|-----|---------|
| Dashboard | `/` | รายการ jobs ทั้งหมด, สถานะ, stats |
| Job Detail | `/jobs/:id` | Findings list + Code diff viewer |
| Repositories | `/repositories` | จัดการ repo ที่ monitor |

Dashboard polling ทุก **5 วินาที** (SWR `refreshInterval`) เพื่ออัปเดตสถานะ job อัตโนมัติ

---

## Severity Summary

| Level | Threshold | สี | ความหมาย |
|-------|-----------|----|---------|
| Critical | ≥ 90% | 🔴 Red | ต้องแก้ไขก่อน merge |
| Warning | ≥ 75% | 🟡 Yellow | ควรพิจารณา refactor |
| Info | ≥ 60% | 🔵 Blue | แจ้งให้ทราบ |
