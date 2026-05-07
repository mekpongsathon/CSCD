# Code Duplication Analyzer System

## Overview

This system analyzes code duplication between GitHub branches and pull requests.

The platform integrates with GitHub Actions and automatically scans newly added or modified code to detect:

- Duplicate logic
- Structural similarity
- Repeated business logic
- Repeated frontend components/hooks
- Repeated backend services/utilities

The system separates frontend and backend analysis and generates independent reports.

---

# Goals

## Primary Goals

- Detect duplicated code introduced in new pull requests
- Reduce repeated business logic
- Encourage code reuse
- Improve maintainability
- Generate readable reports directly in GitHub PRs

---

# System Architecture

```text
GitHub Action
      ↓
Backend API
      ↓
Analysis Job Queue
      ↓
Analyzer Engine
      ↓
PostgreSQL Database
      ↓
Frontend Dashboard
```

---

# Technology Stack

## Frontend

### Framework
- Next.js
- React
- TypeScript
- TailwindCSS

### UI Components
- Monaco Editor
- shadcn/ui

### Responsibilities
- Dashboard
- Analysis reports
- PR history
- Similarity visualization
- Code diff view
- Duplicate highlight viewer

---

## Backend API

### Language
- Go

### Framework
- Fiber

### Responsibilities
- Authentication
- GitHub integration
- Job management
- Report APIs
- Project configuration
- Trigger analysis

---

## Analyzer Engine

### Language
- Go

### Responsibilities
- Parse source code
- Normalize code
- Generate fingerprints
- Detect similarity
- Generate reports

### Core Libraries
- tree-sitter
- tree-sitter-typescript
- tree-sitter-go
- tree-sitter-c-sharp
- tree-sitter-javascript

---

## Database

### Database Engine
- PostgreSQL

### Future Extension
- pgvector

---

# Monorepo Structure

```text
/apps
  /web
  /api
  /analyzer

/packages
  /shared

/docs
  architecture.md
  backend-spec.md
  frontend-spec.md
  analyzer-spec.md
  database-spec.md
  github-action-spec.md
  engineering-rules.md
```

---

# Frontend Responsibilities

## Dashboard

Display:

- Total duplicate findings
- Critical findings
- Duplicate trends
- Repository overview

---

## Pull Request Analysis View

Display:

- Frontend duplicate findings
- Backend duplicate findings
- Similarity percentage
- File mapping
- Code snippets

---

## Code Comparison Viewer

Use Monaco Editor.

Features:

- Side-by-side compare
- Syntax highlighting
- Duplicate block highlighting
- Similarity visualization

---

# Backend API Responsibilities

## API Features

### Repository Management

- Connect GitHub repositories
- Store repository settings
- Configure analysis rules

### Analysis Jobs

- Create analysis jobs
- Queue jobs
- Track progress
- Store results

### Reporting

- Return analysis reports
- Return similarity details
- Return historical trends

---

# Analyzer Responsibilities

## Step 1 - Detect Changed Files

Use:

```bash
git diff origin/main...HEAD
```

Analyze only:

- Added files
- Modified files

Ignore:

- Deleted files
- Generated files
- Build output

---

## Step 2 - Separate Frontend and Backend

Example:

```text
/frontend
/backend
```

Different analyzers may be used for each section.

---

## Step 3 - Normalize Code

Remove:

- Comments
- Formatting
- Empty lines
- Variable names
- Import ordering

Example:

```ts
const total = price * tax
```

Normalized:

```text
VAR = VAR * VAR
```

---

## Step 4 - Parse AST

Use tree-sitter to parse source code.

Goal:

Convert source code into syntax trees for structural comparison.

---

## Step 5 - Generate Fingerprints

Generate:

- Token fingerprints
- AST fingerprints
- Structural hashes

---

## Step 6 - Similarity Detection

Use:

- Token similarity
- N-gram similarity
- Winnowing algorithm
- AST subtree matching

Do NOT use AI as the primary detection engine.

---

## Step 7 - Generate Report

Each finding should include:

- New file path
- Existing similar file path
- Similarity score
- Severity
- Code snippet
- Suggested action

---

# Severity Rules

```yaml
similarity:
  info: 60
  warning: 75
  critical: 90
```

---

# Ignore Rules

```yaml
ignore:
  - dist/**
  - build/**
  - generated/**
  - node_modules/**
  - migrations/**
  - "**/*.g.ts"
```

---

# Minimum Detection Threshold

```yaml
minimum:
  min_lines: 8
  min_tokens: 20
```

---

# GitHub Action Workflow

## Trigger

```yaml
on:
  pull_request:
    types: [opened, synchronize]
```

---

## Flow

```text
Checkout Repository
    ↓
Get Changed Files
    ↓
Call Backend API
    ↓
Create Analysis Job
    ↓
Analyzer Runs
    ↓
Store Results
    ↓
Comment on PR
```

---

# Example GitHub Action

```yaml
name: Code Duplication Analysis

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  analyze:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Run Analysis
        run: |
          curl -X POST http://your-api/analyze
```

---

# PR Comment Example

```text
⚠ Duplicate logic detected

Frontend:
- src/hooks/useTax.ts
  Similar to:
  src/shared/useTaxCalculation.ts
  Similarity: 84%

Backend:
- backend/services/tax.go
  Similar to:
  backend/shared/tax_util.go
  Similarity: 91%
```

---

# Database Design

## repositories

```sql
CREATE TABLE repositories (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    github_url TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## analysis_jobs

```sql
CREATE TABLE analysis_jobs (
    id UUID PRIMARY KEY,
    repository_id UUID NOT NULL,
    branch_name TEXT NOT NULL,
    pull_request_number INTEGER,
    status TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## analysis_results

```sql
CREATE TABLE analysis_results (
    id UUID PRIMARY KEY,
    analysis_job_id UUID NOT NULL,
    category TEXT NOT NULL,
    new_file_path TEXT NOT NULL,
    existing_file_path TEXT NOT NULL,
    similarity_score NUMERIC(5,2) NOT NULL,
    severity TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## fingerprints

```sql
CREATE TABLE fingerprints (
    id UUID PRIMARY KEY,
    repository_id UUID NOT NULL,
    file_path TEXT NOT NULL,
    language TEXT NOT NULL,
    fingerprint_hash TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

# DBeaver Instructions

## Step 1

Install PostgreSQL.

---

## Step 2

Open DBeaver.

---

## Step 3

Create a PostgreSQL connection.

---

## Step 4

Run all SQL scripts from:

```text
/docs/sql
```

---

# Engineering Rules

## General Rules

- Use Go for backend and analyzer
- Use Next.js for frontend
- Use PostgreSQL only
- Avoid unnecessary microservices
- Use repository pattern
- All analyzer logic must be testable

---

## Analyzer Rules

- Do not scan the entire repository on every PR
- Use incremental analysis
- Use deterministic algorithms first
- AI should only assist analysis
- Ignore generated code

---

## Frontend Rules

- Use TypeScript only
- Use reusable components
- Use Monaco for code diff visualization

---

# Future AI Integration

## AI Responsibilities

AI should only:

- Explain duplicate findings
- Suggest refactors
- Detect semantic similarity

AI should NOT:

- Be the primary similarity engine
- Block merges automatically

---

# Future Features

## Phase 2

- Semantic similarity
- AI explanations
- Refactor recommendations
- Historical trends

---

## Phase 3

- Vector search
- Embedding analysis
- Architecture violation detection
- Team duplication analytics

---

# Recommended Development Order

## Phase 1

- Setup monorepo
- Setup PostgreSQL
- Setup backend API
- Setup frontend
- Setup GitHub Action

---

## Phase 2

- Build parser layer
- Build normalizer
- Build fingerprint engine
- Build similarity engine

---

## Phase 3

- Build report viewer
- Build PR comments
- Build dashboard

---

## Phase 4

- Add AI explanation layer
- Add semantic analysis
- Add vector search

---

# Final Notes

The most important parts of this system are:

1. Normalization quality
2. Similarity algorithm quality
3. False positive reduction
4. Report readability

AI should enhance the platform, not replace the core analysis engine.

