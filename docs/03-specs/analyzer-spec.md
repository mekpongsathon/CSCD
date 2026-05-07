# Analyzer Engine Specification

## Overview

Analyzer เขียนด้วย **Go** รันเป็น CLI binary  
รับผิดชอบ: วิเคราะห์ความซ้ำซ้อนของโค้ดโดยใช้ Fingerprinting + Similarity Detection

---

## Algorithm Pipeline

### 1. Detect Changed Files

```bash
git diff --name-only --diff-filter=AM origin/main...HEAD
```

- `--diff-filter=AM` — เฉพาะ Added และ Modified เท่านั้น
- ไม่วิเคราะห์ไฟล์ที่ถูกลบ (Deleted)

---

### 2. Filter Files

**Ignore patterns (ข้ามไฟล์เหล่านี้):**
```
dist/  build/  generated/  node_modules/
migrations/  vendor/  *.g.ts
```

**Minimum threshold (ข้ามไฟล์เล็กเกินไป):**
```
min_lines:  8
min_tokens: 20
```

**Classify by extension:**
| Category | Extensions |
|----------|-----------|
| Frontend | `.ts` `.tsx` `.js` `.jsx` `.css` `.scss` |
| Backend | `.go` `.cs` `.java` `.py` |

---

### 3. Normalize Code

**ลบออก:**
- Single-line comments (`//`, `#`, `--`)
- Blank lines
- Leading/trailing whitespace

**วัตถุประสงค์:** ทำให้โค้ดที่มีโครงสร้างเหมือนกันแต่ format ต่างกัน ได้ fingerprint ใกล้เคียงกัน

---

### 4. Tokenize

แยก code เป็น tokens โดยใช้ whitespace เป็น delimiter

```
"const total = price * tax" → ["const", "total", "=", "price", "*", "tax"]
```

---

### 5. Generate Fingerprints — Winnowing Algorithm

**ขั้นตอน:**
1. สร้าง k-grams (k=5) จาก token list
2. hash แต่ละ k-gram ด้วย FNV-1a 64-bit
3. เลื่อน window (size=4) ไปทั้งหมด
4. เลือก **minimum hash** ในแต่ละ window

```
tokens = ["const", "total", "=", "price", "*", "tax", "rate"]

k-grams (k=5):
  "const total = price *"  → hash_1
  "total = price * tax"    → hash_2
  "= price * tax rate"     → hash_3

window (size=4), sliding:
  [hash_1, hash_2, hash_3] → เลือก min ของแต่ละ window
```

**ผลลัพธ์:** `[]uint64` — fingerprint set ที่ represent โค้ดนั้น

**ข้อดีของ Winnowing:**
- Deterministic (ผลลัพธ์เหมือนกันเสมอสำหรับโค้ดเดิม)
- ทนต่อการเพิ่ม/ลบโค้ดบางส่วน
- ไม่ต้องใช้ AI หรือ ML

---

### 6. Similarity Detection — Jaccard Similarity

```
score = |A ∩ B| / |A ∪ B| × 100
```

- `A` = fingerprint set ของไฟล์ใหม่
- `B` = fingerprint set ของไฟล์เดิม

ค่า score คือ % ความเหมือนกัน

---

### 7. Severity Classification

| Score | Severity | ความหมาย |
|-------|----------|---------|
| ≥ 90% | `critical` | ซ้ำมากผิดปกติ ต้อง refactor |
| ≥ 75% | `warning` | มีส่วนที่ซ้ำมาก ควรพิจารณา |
| ≥ 60% | `info` | มีความคล้ายคลึงกัน แจ้งให้ทราบ |
| < 60% | — | ไม่รายงาน |

---

### 8. Generate Report

Output เป็น JSON file:

```json
{
  "job_id": "a8c3294a-...",
  "repo_path": "/workspace",
  "base_branch": "main",
  "analyzed_at": "2026-05-07T09:00:00Z",
  "total_files": 12,
  "frontend_count": 8,
  "backend_count": 4,
  "findings": [
    {
      "new_file_path": "src/hooks/useTaxCalc.ts",
      "existing_file_path": "src/shared/useTax.ts",
      "similarity_score": 91.5,
      "severity": "critical",
      "category": "frontend",
      "language": "typescript",
      "code_snippet": "...",
      "existing_snippet": "..."
    }
  ]
}
```

---

## CLI Usage

```bash
./analyzer \
  --repo   <path-to-repo>       # default: .
  --base   <base-branch>        # default: main
  --job-id <uuid>               # required
  --output <output-file>        # default: analysis_report.json
```

**Exit codes:**
- `0` — วิเคราะห์สำเร็จ ไม่พบ duplicates
- `1` — วิเคราะห์สำเร็จ พบ duplicates (GitHub Action ใช้ตรวจสอบ)

---

## Project Structure

```
apps/analyzer/
├── main.go                          # CLI entry point
├── go.mod
└── internal/
    └── analyzer/
        └── analyzer.go              # Core logic ทั้งหมด
            ├── Analyzer.Run()       # Main pipeline
            ├── getChangedFiles()    # git diff
            ├── analyzeFile()        # Compare 1 file vs all
            ├── normalize()          # Code normalization
            ├── tokenize()           # Tokenizer
            ├── fingerprint()        # Winnowing
            ├── similarityScore()    # Jaccard
            └── getSeverity()        # Threshold rules
```

---

## Future: Phase 2 — AST Parsing

จะเพิ่ม **tree-sitter** เพื่อ parse AST แทน text-based fingerprint:

```
tree-sitter-typescript
tree-sitter-go
tree-sitter-c-sharp
tree-sitter-javascript
```

ช่วยลด false positive จากโค้ดที่ดูเหมือนกัน แต่ semantic ต่างกัน
