"use client";

import { cn } from "@/lib/utils";

const severityConfig = {
  info: { label: "Info", class: "badge-info" },
  warning: { label: "Warning", class: "badge-warning" },
  critical: { label: "Critical", class: "badge-critical" },
} as const;

interface SeverityBadgeCloneProps {
  severity: keyof typeof severityConfig;
}

export function SeverityBadgeClone({ severity }: SeverityBadgeCloneProps) {
  const { label, class: cls } = severityConfig[severity] ?? severityConfig.info;
  return <span className={cn(cls)}>{label}</span>;
}
