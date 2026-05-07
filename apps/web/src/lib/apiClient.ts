import {
  AnalysisJob,
  AnalysisResult,
  CreateRepositoryRequest,
  Repository,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function fetchData<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api/v1${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const apiClient = {
  repositories: {
    list: () => fetchData<Repository[]>("/repositories"),
    get: (id: string) => fetchData<Repository>(`/repositories/${id}`),
    create: (data: CreateRepositoryRequest) =>
      fetchData<Repository>("/repositories", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchData<void>(`/repositories/${id}`, { method: "DELETE" }),
  },

  jobs: {
    list: (repositoryId?: string) =>
      fetchData<AnalysisJob[]>(
        repositoryId ? `/jobs?repository_id=${repositoryId}` : "/jobs"
      ),
    get: (id: string) => fetchData<AnalysisJob>(`/jobs/${id}`),
    results: (id: string) =>
      fetchData<AnalysisResult[]>(`/jobs/${id}/results`),
  },
};
