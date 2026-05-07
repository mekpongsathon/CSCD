# GitHub Action Setup Guide

## Overview

GitHub Action รันอัตโนมัติเมื่อมี Pull Request เปิดหรืออัปเดต  
ทำหน้าที่: build analyzer → trigger API → รันวิเคราะห์ → comment ผลบน PR

---

## Prerequisite

Backend ต้องเข้าถึงได้จาก internet  
เพราะ GitHub Actions Runner รันบน cloud ไม่สามารถเข้า `localhost` ได้

**ตัวเลือก expose backend:**

| วิธี | เหมาะกับ | วิธีใช้ |
|------|---------|---------|
| **ngrok** | ทดสอบ local | `ngrok http 8080` → ได้ URL เช่น `https://abc123.ngrok.io` |
| **Railway / Render** | staging | Deploy แบบฟรี |
| **VPS / Cloud** | production | Deploy บน server จริง |

---

## Step 1 — Copy Workflow File

นำไฟล์นี้ไปใส่ใน repo ที่ต้องการ monitor:

```
.github/workflows/code-duplication-analysis.yml
```

ไฟล์ต้นฉบับอยู่ที่: `d:\work\CSCD2\.github\workflows\code-duplication-analysis.yml`

---

## Step 2 — Add Repository Secrets

ไปที่ repo บน GitHub:  
`Settings → Secrets and variables → Actions → New repository secret`

| Secret Name | ค่า | ตัวอย่าง |
|-------------|-----|---------|
| `CSCD2_API_URL` | URL ของ backend | `https://abc123.ngrok.io` |
| `CSCD2_DASHBOARD_URL` | URL ของ frontend | `https://abc123.ngrok.io` (หรือ URL อื่น) |

---

## Step 3 — Connect Repository on Dashboard

เปิด http://localhost:3000/repositories แล้วเพิ่ม repo:

| ช่อง | ค่า |
|------|-----|
| Display Name | ชื่อ repo |
| GitHub URL | `https://github.com/owner/repo` |
| Owner | `owner` |
| Repository | `repo` |

---

## Step 4 — Test

1. สร้าง branch ใหม่: `git checkout -b feature/test`
2. เพิ่มหรือแก้ไขไฟล์ แล้ว push
3. เปิด Pull Request บน GitHub
4. ดู tab **Actions** → เห็น workflow รัน
5. หลัง workflow เสร็จ จะมี comment บน PR
6. เปิด Dashboard → เห็น job ใหม่

---

## Workflow Breakdown

```yaml
on:
  pull_request:
    types: [opened, synchronize]
```

**Steps:**

| Step | เครื่องมือ | หน้าที่ |
|------|-----------|--------|
| Checkout | `actions/checkout@v4` | clone repo พร้อม full history |
| Setup Go | `actions/setup-go@v5` | ติดตั้ง Go 1.22 |
| Build Analyzer | `go build` | compile analyzer binary |
| Create Job | `curl POST /analyze` | แจ้ง backend สร้าง job |
| Run Analyzer | `./analyzer` | วิเคราะห์โค้ด → `analysis_report.json` |
| Comment PR | `actions/github-script@v7` | โพสต์ผลลัพธ์บน PR |

---

## PR Comment Format

```
## ⚠️ CSCD2 — Code Duplication Analysis

**Branch:** `feature/my-branch`

| Metric          | Count |
|-----------------|-------|
| Total Findings  | 3     |
| Critical (≥90%) | 1     |

[View Full Report](http://your-dashboard/jobs/<job_id>)

---
*Analyzed by CSCD2*
```

---

## Required Permissions

```yaml
permissions:
  pull-requests: write   # สำหรับ comment บน PR
  contents: read         # สำหรับ checkout โค้ด
```
