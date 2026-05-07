# Local Development Guide

## Prerequisites

| Tool | Version | Download |
|------|---------|---------|
| Node.js | 20+ | https://nodejs.org |
| Go | 1.22+ | https://go.dev |
| PostgreSQL | 15+ | https://www.postgresql.org |
| Git | any | https://git-scm.com |

---

## First-Time Setup

### 1. Clone / เปิด Project

```powershell
cd d:\work\CSCD2
```

### 2. Setup Database

```powershell
# สร้าง database
psql -U postgres -c "CREATE DATABASE cscd2;"

# สร้างตาราง
psql -U postgres -d cscd2 -f docs/sql/001_create_tables.sql
```

### 3. Setup Environment Variables

```powershell
# Backend
copy apps\api\.env.example apps\api\.env

# Frontend
copy apps\web\.env.example apps\web\.env.local
```

แก้ไข `apps/api/.env`:
```env
DATABASE_URL=postgres://postgres:<your-password>@localhost:5432/cscd2?sslmode=disable
PORT=8080
CORS_ORIGINS=http://localhost:3000
```

### 4. Install Dependencies

```powershell
# Go backend
cd apps\api
go mod tidy

# Go analyzer
cd ..\analyzer
go mod tidy

# Frontend
cd ..\web
npm install
```

---

## Running Services

เปิด **3 terminal** แยกกัน:

### Terminal 1 — Backend API

```powershell
cd d:\work\CSCD2\apps\api
go run .
# รันที่ http://localhost:8080
```

### Terminal 2 — Frontend

```powershell
cd d:\work\CSCD2\apps\web
npm run dev
# รันที่ http://localhost:3000
```

### Terminal 3 — สำหรับ command ทั่วไป

---

## Testing Without GitHub Action

### สร้าง Test Job ผ่าน API

```powershell
# 1. ดู repository ID
Invoke-RestMethod -Uri "http://localhost:8080/api/v1/repositories" | ConvertTo-Json

# 2. สร้าง job
$body = @{
    repository_id = "<repo-id>"
    branch_name = "feature/test"
    pull_request_number = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/v1/jobs" `
    -Method POST -ContentType "application/json" -Body $body
```

### Insert Mock Results

```powershell
$jobId = "<job-id>"

psql -U postgres -d cscd2 -c "
UPDATE analysis_jobs 
SET status='completed', started_at=NOW(), completed_at=NOW() 
WHERE id='$jobId';
"

psql -U postgres -d cscd2 -c "
INSERT INTO analysis_results 
  (analysis_job_id, category, new_file_path, existing_file_path, 
   similarity_score, severity, language, code_snippet, existing_snippet)
VALUES
  ('$jobId', 'frontend', 'src/hooks/useNew.ts', 'src/hooks/useOld.ts', 
   91.5, 'critical', 'typescript', 'code here', 'code here'),
  ('$jobId', 'backend', 'services/new.go', 'services/old.go', 
   78.0, 'warning', 'go', 'code here', 'code here');
"
```

---

## API Testing

```powershell
# Health check
Invoke-RestMethod http://localhost:8080/api/v1/health

# ดู repositories
Invoke-RestMethod http://localhost:8080/api/v1/repositories | ConvertTo-Json

# ดู jobs
Invoke-RestMethod http://localhost:8080/api/v1/jobs | ConvertTo-Json -Depth 5

# ดูผลของ job
Invoke-RestMethod http://localhost:8080/api/v1/jobs/<job-id>/results | ConvertTo-Json
```

---

## URLs

| Service | URL |
|---------|-----|
| Frontend Dashboard | http://localhost:3000 |
| Backend API | http://localhost:8080 |
| API Health | http://localhost:8080/api/v1/health |

---

## Common Issues

| ปัญหา | สาเหตุ | วิธีแก้ |
|-------|--------|--------|
| `DATABASE_URL is not set` | ไม่มีไฟล์ `.env` | `copy apps\api\.env.example apps\api\.env` |
| `failed to ping database` | Password ผิด หรือ PostgreSQL ไม่รัน | เช็ค service PostgreSQL และ password |
| `job/undefined` บนเว็บ | Next.js params เป็น Promise | อัปเดตไฟล์ `jobs/[id]/page.tsx` ให้ `await params` |
| CORS error | Frontend URL ไม่ตรงกับ `CORS_ORIGINS` | แก้ค่าใน `.env` ให้ตรง |
