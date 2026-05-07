export interface Repository {
  id: string;
  name: string;
  github_url: string;
  owner: string;
  repo: string;
  created_at: string;
  updated_at: string;
}

export interface AnalysisJob {
  id: string;
  repository_id: string;
  branch_name: string;
  pull_request_number?: number;
  status: "pending" | "running" | "completed" | "failed";
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface AnalysisResult {
  id: string;
  analysis_job_id: string;
  category: "frontend" | "backend";
  new_file_path: string;
  existing_file_path: string;
  similarity_score: number;
  severity: "info" | "warning" | "critical";
  code_snippet?: string;
  existing_snippet?: string;
  language: string;
  created_at: string;
}

export interface CreateRepositoryRequest {
  name: string;
  github_url: string;
  owner: string;
  repo: string;
}
