# Backend API Specification

## Overview

Backend เขียนด้วย **Go** ใช้ **Fiber v2** framework  
รับผิดชอบ: จัดการ repositories, analysis jobs, results และรับ trigger จาก GitHub Action

---

## Base URL

```
http://localhost:8080/api/v1
```

---

## Endpoints

### Health Check

```
GET /health
```
Response:
```json
{ "status": "ok" }
```

---

### Repositories

| Method | Path | Description |
|--------|------|-------------|
| GET | `/repositories` | ดูรายการ repo ทั้งหมด |
| POST | `/repositories` | เพิ่ม repo ใหม่ |
| GET | `/repositories/:id` | ดูรายละเอียด repo |
| DELETE | `/repositories/:id` | ลบ repo |

**POST /repositories — Request Body:**
```json
{
  "name": "Flow-BI",
  "github_url": "https://github.com/Solution-Dev3/Flow-BI",
  "owner": "Solution-Dev3",
  "repo": "Flow-BI"
}
```

---

### Analysis Jobs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/jobs` | ดูรายการ jobs (filter ด้วย `?repository_id=`) |
| POST | `/jobs` | สร้าง job ใหม่ |
| GET | `/jobs/:id` | ดูรายละเอียด job |
| GET | `/jobs/:id/results` | ดูผลการวิเคราะห์ของ job |

**POST /jobs — Request Body:**
```json
{
  "repository_id": "12d62211-...",
  "branch_name": "feature/my-branch",
  "pull_request_number": 42
}
```

**Job Status Values:**
| Status | ความหมาย |
|--------|---------|
| `pending` | รอวิเคราะห์ |
| `running` | กำลังวิเคราะห์ |
| `completed` | เสร็จสิ้น |
| `failed` | เกิดข้อผิดพลาด |

---

### Trigger Analysis (GitHub Action)

```
POST /analyze
```

**Request Body:**
```json
{
  "repository_url": "https://github.com/owner/repo",
  "branch_name": "feature/my-branch",
  "pull_request_number": 42,
  "base_branch": "main"
}
```

**Response:**
```json
{
  "job_id": "a8c3294a-...",
  "status": "pending",
  "message": "Analysis job created successfully"
}
```

> ถ้า repository ยังไม่มีในระบบ จะ auto-register ให้อัตโนมัติ

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `PORT` | `8080` | HTTP port |
| `CORS_ORIGINS` | — | Allowed CORS origins |

**ตัวอย่าง `.env`:**
```env
DATABASE_URL=postgres://postgres:password@localhost:5432/cscd2?sslmode=disable
PORT=8080
CORS_ORIGINS=http://localhost:3000
```

---

## Project Structure

```
apps/api/
├── main.go                    # Entry point, routes
├── go.mod
├── .env
├── Dockerfile
└── internal/
    ├── database/
    │   └── db.go              # PostgreSQL connection pool (pgxpool)
    ├── model/
    │   └── model.go           # Structs + DTOs
    └── handler/
        └── handler.go         # Route handlers
```

---

## Running

```bash
cd apps/api
go run .
# หรือ build
go build -o api .
./api
```
