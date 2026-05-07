"use client";

import { cn } from "@/lib/utils";

const map = {
  info: { label: "Info", class: "badge-info" },
  warning: { label: "Warning", class: "badge-warning" },
  critical: { label: "Critical", class: "badge-critical" },
} as const;

interface Props {
  severity: keyof typeof map;
}

export function SeverityBadge({ severity }: Props) {
  const { label, class: cls } = map[severity] ?? map.info;
  return <span className={cls}>{label}</span>;
}
