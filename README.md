# Code Duplication Analyzer

A monorepo for detecting code duplication between GitHub branches and pull requests.

## Structure

```
/apps
  /web        - Next.js frontend dashboard
  /api        - Go backend API (Fiber)
  /analyzer   - Go analyzer engine

/packages
  /shared     - Shared TypeScript types

/docs
  /sql        - Database migration scripts
```

## Quick Start

### Prerequisites
- Node.js 20+
- Go 1.22+
- PostgreSQL 15+
- Docker (optional)

### Setup

```bash
# Install frontend dependencies
npm install

# Setup environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# Run database migrations
psql -U postgres -d cscd2 -f docs/sql/001_create_tables.sql

# Start development
npm run dev          # frontend
cd apps/api && go run main.go   # backend
cd apps/analyzer && go run main.go  # analyzer
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, React, TypeScript, TailwindCSS |
| UI Components | Monaco Editor, shadcn/ui |
| Backend | Go, Fiber |
| Analyzer | Go, tree-sitter |
| Database | PostgreSQL |
| CI/CD | GitHub Actions |
