import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Duplicate of utils.ts for testing duplication detection
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export function getSeverityLabel(score: number): "info" | "warning" | "critical" {
  if (score >= 90) return "critical";
  if (score >= 75) return "warning";
  return "info";
}
