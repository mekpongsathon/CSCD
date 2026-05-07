# Database Specification

## Engine

**PostgreSQL 15+**  
Extension: `pgcrypto` (สำหรับ `gen_random_uuid()`)

---

## Tables

### `repositories`

เก็บข้อมูล GitHub repositories ที่ต้องการ monitor

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Auto-generated |
| `name` | TEXT | Display name |
| `github_url` | TEXT UNIQUE | URL ของ repo บน GitHub |
| `owner` | TEXT | GitHub username / org |
| `repo` | TEXT | Repository name |
| `created_at` | TIMESTAMP | วันที่เพิ่ม |
| `updated_at` | TIMESTAMP | วันที่แก้ไขล่าสุด |

---

### `analysis_jobs`

เก็บ job การวิเคราะห์แต่ละครั้ง (1 PR = 1 job)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Auto-generated |
| `repository_id` | UUID FK | อ้างอิง `repositories.id` |
| `branch_name` | TEXT | branch ที่วิเคราะห์ |
| `pull_request_number` | INTEGER nullable | PR number บน GitHub |
| `status` | TEXT | `pending` / `running` / `completed` / `failed` |
| `error_message` | TEXT nullable | ข้อความ error ถ้า failed |
| `started_at` | TIMESTAMP nullable | เวลาเริ่มวิเคราะห์ |
| `completed_at` | TIMESTAMP nullable | เวลาเสร็จสิ้น |
| `created_at` | TIMESTAMP | วันที่สร้าง job |

**Indexes:**
- `repository_id`
- `status`

---

### `analysis_results`

เก็บผลการวิเคราะห์แต่ละ finding (1 job มีได้หลาย results)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Auto-generated |
| `analysis_job_id` | UUID FK | อ้างอิง `analysis_jobs.id` |
| `category` | TEXT | `frontend` หรือ `backend` |
| `new_file_path` | TEXT | ไฟล์ใหม่ใน PR |
| `existing_file_path` | TEXT | ไฟล์เดิมที่คล้ายกัน |
| `similarity_score` | NUMERIC(5,2) | ค่าความเหมือน 0-100 |
| `severity` | TEXT | `info` / `warning` / `critical` |
| `code_snippet` | TEXT nullable | snippet ของไฟล์ใหม่ |
| `existing_snippet` | TEXT nullable | snippet ของไฟล์เดิม |
| `language` | TEXT | `typescript` / `go` / `python` ฯลฯ |
| `created_at` | TIMESTAMP | วันที่บันทึก |

**Indexes:**
- `analysis_job_id`
- `severity`

---

### `fingerprints`

เก็บ fingerprint ของทุกไฟล์ใน repo (ใช้เปรียบเทียบในอนาคต)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Auto-generated |
| `repository_id` | UUID FK | อ้างอิง `repositories.id` |
| `file_path` | TEXT | path ของไฟล์ |
| `language` | TEXT | ภาษา |
| `fingerprint_hash` | TEXT | hash ของ fingerprint |
| `token_count` | INTEGER | จำนวน tokens |
| `line_count` | INTEGER | จำนวน lines |
| `created_at` | TIMESTAMP | วันที่บันทึก |
| `updated_at` | TIMESTAMP | วันที่อัปเดต |

**Unique constraint:** `(repository_id, file_path)`

**Indexes:**
- `repository_id`
- `fingerprint_hash`

---

## Entity Relationship Diagram

```
repositories
    │
    │ 1:N
    ├──────────────────────┐
    │                      │
    ▼                      ▼
analysis_jobs          fingerprints
    │
    │ 1:N
    ▼
analysis_results
```

---

## Migration

```bash
psql -U postgres -d cscd2 -f docs/sql/001_create_tables.sql
```

**ไฟล์ migration:** `docs/sql/001_create_tables.sql`

---

## Connection String Format

```
postgres://<user>:<password>@<host>:<port>/<database>?sslmode=disable
```

**Local:**
```
postgres://postgres:postgres@localhost:5432/cscd2?sslmode=disable
```

---

## Useful Queries

```sql
-- ดู jobs ทั้งหมดพร้อม repo name
SELECT j.id, r.name, j.branch_name, j.status, j.created_at
FROM analysis_jobs j
JOIN repositories r ON j.repository_id = r.id
ORDER BY j.created_at DESC;

-- ดู critical findings ทั้งหมด
SELECT new_file_path, existing_file_path, similarity_score
FROM analysis_results
WHERE severity = 'critical'
ORDER BY similarity_score DESC;

-- สรุปจำนวน findings ต่อ job
SELECT analysis_job_id, severity, COUNT(*)
FROM analysis_results
GROUP BY analysis_job_id, severity;
```
