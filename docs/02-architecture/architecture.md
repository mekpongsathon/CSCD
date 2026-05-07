# System Architecture

## Overview

CSCD2 (Code Duplication Analyzer) เป็นระบบวิเคราะห์ความซ้ำซ้อนของโค้ดระหว่าง branch และ pull request บน GitHub
ระบบทำงานแบบอัตโนมัติเมื่อมี PR เข้ามา และแสดงผลผ่าน Dashboard

---

## System Flow Diagram

```
Developer opens PR on GitHub
         │
         ▼
  GitHub Action triggers
  (on: pull_request)
         │
         ▼
  Checkout Repository
  (fetch-depth: 0)
         │
         ▼
  Build Analyzer Binary
  (Go build)
         │
         ▼
  POST /api/v1/analyze
  (Create Analysis Job)
         │
         ▼
  Analyzer Engine runs
  (Git diff → Parse → Normalize → Fingerprint → Compare)
         │
         ▼
  Store Results in PostgreSQL
         │
         ▼
  Comment on PR
  (GitHub Script)
         │
         ▼
  Developer views Dashboard
  (http://localhost:3000)
```

---

## Component Diagram

```
┌─────────────────────────────────────────────────────┐
│                   GitHub                            │
│  ┌──────────────┐    ┌──────────────────────────┐  │
│  │  Pull Request │    │   GitHub Actions Runner   │  │
│  │  (trigger)    │───▶│   code-duplication.yml   │  │
│  └──────────────┘    └──────────────────────────┘  │
└────────────────────────────┬────────────────────────┘
                             │ HTTP POST /analyze
                             ▼
┌─────────────────────────────────────────────────────┐
│                  Backend (Go + Fiber)                │
│  ┌────────────┐  ┌──────────┐  ┌─────────────────┐ │
│  │ Repositories│  │  Jobs    │  │    Results      │ │
│  │   API       │  │   API    │  │    API          │ │
│  └────────────┘  └──────────┘  └─────────────────┘ │
└────────────────────────────┬────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────┐
│              PostgreSQL Database                    │
│  repositories │ analysis_jobs │ analysis_results   │
│  fingerprints                                       │
└─────────────────────────────────────────────────────┘
                             ▲
                             │ SWR fetch
┌─────────────────────────────────────────────────────┐
│              Frontend (Next.js 16)                  │
│  ┌───────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ Dashboard │  │ Job Detail   │  │ Repositories│  │
│  │           │  │ + Monaco Diff│  │ Manager     │  │
│  └───────────┘  └──────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Version | Role |
|-------|-----------|---------|------|
| Frontend Framework | Next.js | 16.x | SSR/SSG + App Router |
| Frontend UI | React | 18.x | Component rendering |
| Styling | TailwindCSS | 3.x | Utility-first CSS |
| Code Editor | Monaco Editor | 4.x | Diff visualization |
| Data Fetching | SWR | 2.x | Client-side fetching + polling |
| Backend Language | Go | 1.22+ | API + Analyzer |
| Backend Framework | Fiber | v2 | HTTP server |
| Database | PostgreSQL | 15+ | Persistent storage |
| DB Driver | pgx/v5 | 5.x | Go PostgreSQL driver |
| CI/CD | GitHub Actions | — | Automated trigger |
| Code Parsing | tree-sitter | — | AST generation (Phase 2) |

---

## Port Reference

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend API | 8080 | http://localhost:8080 |
| PostgreSQL | 5432 | localhost:5432 |
