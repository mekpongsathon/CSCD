"use client";

import { cn } from "@/lib/utils";

const statusMap = {
  pending: { label: "Pending", class: "bg-soft-stone text-muted-slate" },
  running: { label: "Running", class: "bg-pale-blue text-action-blue" },
  completed: { label: "Completed", class: "bg-pale-green text-enterprise-green" },
  failed: { label: "Failed", class: "bg-red-50 text-error-red" },
} as const;

interface StatusBadgeMirrorProps {
  status: keyof typeof statusMap;
}

export function StatusBadgeMirror({ status }: StatusBadgeMirrorProps) {
  const { label, class: cls } = statusMap[status] ?? statusMap.pending;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-xs text-mono-label uppercase tracking-wider text-xs font-medium",
        cls
      )}
    >
      {label}
    </span>
  );
}