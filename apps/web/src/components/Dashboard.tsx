"use client";

import useSWR from "swr";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { AnalysisJob, Repository } from "@/types";
import { StatusBadge } from "@/components/StatusBadge";
import { SeverityBadge } from "@/components/SeverityBadge";
import { AlertTriangle, GitBranch, Clock, CheckCircle2, XCircle } from "lucide-react";

export function Dashboard() {
  const { data: jobs, isLoading: jobsLoading } = useSWR<AnalysisJob[]>(
    "jobs",
    () => api.jobs.list(),
    { refreshInterval: 5000 }
  );
  const { data: repos } = useSWR<Repository[]>("repos", () =>
    api.repositories.list()
  );

  const totalJobs = jobs?.length ?? 0;
  const completedJobs = jobs?.filter((j) => j.status === "completed").length ?? 0;
  const failedJobs = jobs?.filter((j) => j.status === "failed").length ?? 0;
  const runningJobs = jobs?.filter(
    (j) => j.status === "running" || j.status === "pending"
  ).length ?? 0;

  return (
    <main>
      {/* Hero */}
      <section className="border-b border-hairline py-16">
        <div className="container-main">
          <p className="text-mono-label uppercase tracking-widest text-muted-slate mb-4">
            Dashboard
          </p>
          <h1 className="font-display text-section-heading text-near-black mb-4 max-w-2xl">
            Code Duplication Analysis
          </h1>
          <p className="text-body-large text-muted-slate max-w-xl">
            Monitor duplicate logic across your pull requests. Catch repeated
            patterns before they ship.
          </p>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b border-hairline py-10">
        <div className="container-main grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard
            label="Total Jobs"
            value={totalJobs}
            icon={<GitBranch size={20} className="text-muted-slate" />}
          />
          <StatCard
            label="Completed"
            value={completedJobs}
            icon={<CheckCircle2 size={20} className="text-enterprise-green" />}
            valueClass="text-enterprise-green"
          />
          <StatCard
            label="Running"
            value={runningJobs}
            icon={<Clock size={20} className="text-action-blue" />}
            valueClass="text-action-blue"
          />
          <StatCard
            label="Failed"
            value={failedJobs}
            icon={<XCircle size={20} className="text-error-red" />}
            valueClass="text-error-red"
          />
        </div>
      </section>

      {/* Recent analysis jobs */}
      <section className="py-12">
        <div className="container-main">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-card-heading text-near-black font-display">
              Recent Analysis Jobs
            </h2>
            <Link href="/repositories" className="btn-secondary text-sm">
              Manage Repositories →
            </Link>
          </div>

          {jobsLoading ? (
            <SkeletonRows />
          ) : jobs && jobs.length > 0 ? (
            <div className="border border-hairline rounded-sm divide-y divide-hairline">
              {jobs.map((job) => (
                <JobRow key={job.id} job={job} repos={repos ?? []} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </section>
    </main>
  );
}

// ---- sub-components ----

function StatCard({
  label,
  value,
  icon,
  valueClass = "text-near-black",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="card-stone rounded-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-mono-label text-muted-slate uppercase tracking-wider text-xs">
          {label}
        </span>
        {icon}
      </div>
      <p className={`text-card-heading font-display font-semibold ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function JobRow({ job, repos }: { job: AnalysisJob; repos: Repository[] }) {
  const repo = repos.find((r) => r.id === job.repository_id);

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="flex items-center justify-between px-5 py-4 hover:bg-soft-stone transition-colors group"
    >
      <div className="flex items-center gap-4 min-w-0">
        <GitBranch size={16} className="text-muted-slate shrink-0" />
        <div className="min-w-0">
          <p className="text-body text-ink truncate group-hover:underline">
            {repo?.name ?? job.repository_id.slice(0, 8)}
          </p>
          <p className="text-caption text-muted-slate">
            {job.branch_name}
            {job.pull_request_number && ` · PR #${job.pull_request_number}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <StatusBadge status={job.status} />
        <span className="text-caption text-muted-slate hidden sm:block">
          {formatDate(job.created_at)}
        </span>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="border border-hairline rounded-sm p-16 text-center">
      <AlertTriangle size={32} className="text-muted-slate mx-auto mb-4" />
      <h3 className="text-feature-heading text-near-black mb-2">
        No analysis jobs yet
      </h3>
      <p className="text-body text-muted-slate mb-6">
        Connect a repository and push a pull request to start detecting duplicates.
      </p>
      <Link href="/repositories" className="btn-primary">
        Connect Repository
      </Link>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="border border-hairline rounded-sm divide-y divide-hairline">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between px-5 py-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-4 h-4 bg-hairline rounded" />
            <div className="space-y-2">
              <div className="w-40 h-4 bg-hairline rounded" />
              <div className="w-24 h-3 bg-hairline rounded" />
            </div>
          </div>
          <div className="w-20 h-6 bg-hairline rounded-xs" />
        </div>
      ))}
    </div>
  );
}
