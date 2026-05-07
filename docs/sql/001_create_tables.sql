-- Migration: 001_create_tables.sql
-- Code Duplication Analyzer Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- repositories
-- =============================================
CREATE TABLE IF NOT EXISTS repositories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    github_url  TEXT NOT NULL UNIQUE,
    owner       TEXT NOT NULL,
    repo        TEXT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================
-- analysis_jobs
-- =============================================
CREATE TABLE IF NOT EXISTS analysis_jobs (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id        UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    branch_name          TEXT NOT NULL,
    pull_request_number  INTEGER,
    status               TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    error_message        TEXT,
    started_at           TIMESTAMP,
    completed_at         TIMESTAMP,
    created_at           TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analysis_jobs_repository_id ON analysis_jobs(repository_id);
CREATE INDEX idx_analysis_jobs_status ON analysis_jobs(status);

-- =============================================
-- analysis_results
-- =============================================
CREATE TABLE IF NOT EXISTS analysis_results (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_job_id   UUID NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE,
    category          TEXT NOT NULL CHECK (category IN ('frontend', 'backend')),
    new_file_path     TEXT NOT NULL,
    existing_file_path TEXT NOT NULL,
    similarity_score  NUMERIC(5,2) NOT NULL,
    severity          TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    code_snippet      TEXT,
    existing_snippet  TEXT,
    language          TEXT NOT NULL,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analysis_results_job_id ON analysis_results(analysis_job_id);
CREATE INDEX idx_analysis_results_severity ON analysis_results(severity);

-- =============================================
-- fingerprints
-- =============================================
CREATE TABLE IF NOT EXISTS fingerprints (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id    UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    file_path        TEXT NOT NULL,
    language         TEXT NOT NULL,
    fingerprint_hash TEXT NOT NULL,
    token_count      INTEGER NOT NULL DEFAULT 0,
    line_count       INTEGER NOT NULL DEFAULT 0,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (repository_id, file_path)
);

CREATE INDEX idx_fingerprints_repository_id ON fingerprints(repository_id);
CREATE INDEX idx_fingerprints_hash ON fingerprints(fingerprint_hash);
