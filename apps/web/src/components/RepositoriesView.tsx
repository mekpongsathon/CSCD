"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { api } from "@/lib/api";
import { Repository } from "@/types";
import { formatDate } from "@/lib/utils";
import { Trash2, Plus, Github, AlertCircle } from "lucide-react";

export function RepositoriesView() {
  const { mutate } = useSWRConfig();
  const { data: repos, isLoading } = useSWR<Repository[]>("repos", () =>
    api.repositories.list()
  );

  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    github_url: "",
    owner: "",
    repo: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await api.repositories.create(form);
      await mutate("repos");
      setForm({ name: "", github_url: "", owner: "", repo: "" });
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create repository");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this repository? All associated jobs will be removed.")) return;
    try {
      await api.repositories.delete(id);
      await mutate("repos");
    } catch {
      // ignore
    }
  }

  return (
    <main className="container-main py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-mono-label text-muted-slate uppercase tracking-widest mb-1">
            Settings
          </p>
          <h1 className="font-display text-section-heading text-near-black">
            Repositories
          </h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary gap-2">
          <Plus size={16} />
          Connect Repo
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 border border-hairline rounded-sm p-6 bg-canvas-white"
        >
          <h2 className="text-feature-heading text-near-black mb-4">
            Connect a GitHub Repository
          </h2>

          {formError && (
            <div className="mb-4 flex items-center gap-2 text-error-red text-caption bg-red-50 p-3 rounded-xs">
              <AlertCircle size={14} />
              {formError}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <Field
              label="Display Name"
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="My Repo"
              required
            />
            <Field
              label="GitHub URL"
              value={form.github_url}
              onChange={(v) => setForm((f) => ({ ...f, github_url: v }))}
              placeholder="https://github.com/owner/repo"
              required
              type="url"
            />
            <Field
              label="Owner"
              value={form.owner}
              onChange={(v) => setForm((f) => ({ ...f, owner: v }))}
              placeholder="owner"
              required
            />
            <Field
              label="Repository"
              value={form.repo}
              onChange={(v) => setForm((f) => ({ ...f, repo: v }))}
              placeholder="repo-name"
              required
            />
          </div>

          <div className="flex gap-3 mt-5">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Connecting..." : "Connect Repository"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Repos list */}
      {isLoading ? (
        <SkeletonList />
      ) : repos && repos.length > 0 ? (
        <div className="border border-hairline rounded-sm divide-y divide-hairline">
          {repos.map((repo) => (
            <div
              key={repo.id}
              className="flex items-center justify-between px-5 py-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Github size={18} className="text-muted-slate shrink-0" />
                <div className="min-w-0">
                  <p className="text-body text-ink font-medium truncate">
                    {repo.name}
                  </p>
                  <a
                    href={repo.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-caption text-action-blue underline truncate"
                  >
                    {repo.github_url}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-micro text-muted-slate hidden sm:block">
                  {formatDate(repo.created_at)}
                </span>
                <button
                  onClick={() => handleDelete(repo.id)}
                  className="text-muted-slate hover:text-error-red transition-colors p-1"
                  aria-label="Delete repository"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-hairline rounded-sm p-14 text-center">
          <Github size={28} className="text-muted-slate mx-auto mb-3" />
          <p className="text-feature-heading text-near-black mb-2">
            No repositories connected
          </p>
          <p className="text-body text-muted-slate">
            Connect your first repository to start analyzing pull requests.
          </p>
        </div>
      )}
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-caption text-ink mb-1.5">
        {label}
        {required && <span className="text-coral ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full border border-border-light rounded-xs px-3 py-2 text-body text-ink
                   placeholder:text-muted-slate focus:outline-none focus:border-focus-blue
                   focus:ring-1 focus:ring-focus-blue transition-colors"
      />
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="border border-hairline rounded-sm divide-y divide-hairline animate-pulse">
      {[1, 2].map((i) => (
        <div key={i} className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-hairline rounded" />
            <div className="space-y-2">
              <div className="w-32 h-4 bg-hairline rounded" />
              <div className="w-48 h-3 bg-hairline rounded" />
            </div>
          </div>
          <div className="w-8 h-8 bg-hairline rounded" />
        </div>
      ))}
    </div>
  );
}
