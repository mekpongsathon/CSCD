"use client";

import useSWR from "swr";
import Link from "next/link";
import { api } from "@/lib/api";
import { AnalysisJob, AnalysisResult } from "@/types";
import { StatusBadge } from "@/components/StatusBadge";
import { SeverityBadge } from "@/components/SeverityBadge";
import { CodeCompare } from "@/components/CodeCompare";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, GitBranch, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface Props {
  jobId: string;
}

export function JobDetailView({ jobId }: Props) {
  const { data: job } = useSWR<AnalysisJob>(
    `job-${jobId}`,
    () => api.jobs.get(jobId),
    { refreshInterval: 3000 }
  );

  const { data: results } = useSWR<AnalysisResult[]>(
    job?.status === "completed" ? `results-${jobId}` : null,
    () => api.jobs.results(jobId)
  );

  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null);
  const [activeCategory, setActiveCategory] = useState<"all" | "frontend" | "backend">("all");

  const filtered = results?.filter(
    (r) => activeCategory === "all" || r.category === activeCategory
  );

  const frontendCount = results?.filter((r) => r.category === "frontend").length ?? 0;
  const backendCount = results?.filter((r) => r.category === "backend").length ?? 0;
  const criticalCount = results?.filter((r) => r.severity === "critical").length ?? 0;

  return (
    <main className="container-main py-8">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-muted-slate text-caption hover:text-ink mb-6"
      >
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      {/* Job header */}
      {job ? (
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-mono-label text-muted-slate uppercase tracking-widest mb-1">
                Analysis Job
              </p>
              <h1 className="font-display text-section-heading text-near-black">
                {job.branch_name}
                {job.pull_request_number && (
                  <span className="text-muted-slate"> · PR #{job.pull_request_number}</span>
                )}
              </h1>
              <p className="text-caption text-muted-slate mt-1">
                Created {formatDate(job.created_at)}
              </p>
            </div>
            <StatusBadge status={job.status} />
          </div>

          {/* Stats */}
          {results && (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="card-stone rounded-sm p-4">
                <p className="text-xs text-muted-slate uppercase tracking-wider mb-1">Total</p>
                <p className="text-card-heading font-display font-semibold text-near-black">
                  {results.length}
                </p>
              </div>
              <div className="card-stone rounded-sm p-4">
                <p className="text-xs text-muted-slate uppercase tracking-wider mb-1">Critical</p>
                <p className="text-card-heading font-display font-semibold text-error-red">
                  {criticalCount}
                </p>
              </div>
              <div className="card-stone rounded-sm p-4">
                <p className="text-xs text-muted-slate uppercase tracking-wider mb-1">Frontend</p>
                <p className="text-card-heading font-display font-semibold text-action-blue">
                  {frontendCount}
                </p>
              </div>
              <div className="card-stone rounded-sm p-4">
                <p className="text-xs text-muted-slate uppercase tracking-wider mb-1">Backend</p>
                <p className="text-card-heading font-display font-semibold text-enterprise-green">
                  {backendCount}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="animate-pulse h-24 bg-soft-stone rounded-sm mb-8" />
      )}

      {/* Category filters */}
      {results && (
        <div className="flex gap-2 mb-6">
          {(["all", "frontend", "backend"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={
                activeCategory === cat ? "chip-coral-active" : "chip-coral"
              }
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Results list */}
      {job?.status === "running" || job?.status === "pending" ? (
        <div className="dark-band rounded-sm p-10 text-center">
          <p className="text-white text-feature-heading">Analysis in progress...</p>
          <p className="text-white/70 text-body mt-2">This page refreshes automatically.</p>
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Findings list */}
          <div className="border border-hairline rounded-sm divide-y divide-hairline overflow-hidden">
            {filtered.map((result) => (
              <button
                key={result.id}
                onClick={() => setSelectedResult(result)}
                className={`w-full text-left px-5 py-4 hover:bg-soft-stone transition-colors ${
                  selectedResult?.id === result.id ? "bg-soft-stone" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-caption text-ink font-medium truncate">
                    {result.new_file_path}
                  </p>
                  <SeverityBadge severity={result.severity} />
                </div>
                <p className="text-micro text-muted-slate truncate">
                  Similar to: {result.existing_file_path}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <SimilarityBar score={result.similarity_score} />
                  <span className="text-xs text-muted-slate font-mono">
                    {result.similarity_score.toFixed(1)}%
                  </span>
                  <span className="chip-coral text-xs py-0.5">{result.category}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Code compare panel */}
          <div className="border border-hairline rounded-sm overflow-hidden">
            {selectedResult ? (
              <CodeCompare result={selectedResult} />
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-slate text-body">
                Select a finding to view code
              </div>
            )}
          </div>
        </div>
      ) : job?.status === "completed" ? (
        <div className="border border-hairline rounded-sm p-12 text-center">
          <AlertTriangle size={28} className="text-muted-slate mx-auto mb-3" />
          <p className="text-feature-heading text-near-black">No duplicates found</p>
          <p className="text-body text-muted-slate mt-2">
            This branch looks clean — no significant code duplication detected.
          </p>
        </div>
      ) : null}
    </main>
  );
}

function SimilarityBar({ score }: { score: number }) {
  const color =
    score >= 90
      ? "bg-error-red"
      : score >= 75
      ? "bg-yellow-400"
      : "bg-action-blue";

  return (
    <div className="flex-1 bg-soft-stone rounded-full h-1.5 max-w-24">
      <div
        className={`h-1.5 rounded-full ${color}`}
        style={{ width: `${Math.min(score, 100)}%` }}
      />
    </div>
  );
}
