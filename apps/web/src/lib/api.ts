import {
  AnalysisJob,
  AnalysisResult,
  CreateRepositoryRequest,
  Repository,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}/api/v1${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// =============================================
// Repositories
// =============================================
export const api = {
  repositories: {
    list: () => request<Repository[]>("/repositories"),
    get: (id: string) => request<Repository>(`/repositories/${id}`),
    create: (data: CreateRepositoryRequest) =>
      request<Repository>("/repositories", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/repositories/${id}`, { method: "DELETE" }),
  },

  jobs: {
    list: (repositoryId?: string) => {
      const qs = repositoryId ? `?repository_id=${repositoryId}` : "";
      return request<AnalysisJob[]>(`/jobs${qs}`);
    },
    get: (id: string) => request<AnalysisJob>(`/jobs/${id}`),
    results: (id: string) => request<AnalysisResult[]>(`/jobs/${id}/results`),
  },
};
