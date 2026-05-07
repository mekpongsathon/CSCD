"use client";

import dynamic from "next/dynamic";
import { AnalysisResult } from "@/types";
import { SeverityBadge } from "@/components/SeverityBadge";

// Lazy load Monaco to avoid SSR issues
const MonacoDiffEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.DiffEditor),
  { ssr: false, loading: () => <div className="animate-pulse h-64 bg-soft-stone" /> }
);

interface Props {
  result: AnalysisResult;
}

export function CodeCompare({ result }: Props) {
  const lang = monacoLang(result.language);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-hairline bg-soft-stone flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-slate uppercase tracking-wider mb-0.5">
            Code Comparison
          </p>
          <p className="text-caption text-ink truncate">
            {result.new_file_path}
          </p>
          <p className="text-micro text-muted-slate truncate">
            vs {result.existing_file_path}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <SeverityBadge severity={result.severity} />
          <span className="text-xs font-mono text-muted-slate">
            {result.similarity_score.toFixed(1)}% similar
          </span>
        </div>
      </div>

      {/* Monaco diff editor */}
      <div className="flex-1 min-h-[360px]">
        {result.code_snippet && result.existing_snippet ? (
          <MonacoDiffEditor
            original={result.existing_snippet}
            modified={result.code_snippet}
            language={lang}
            theme="vs"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 12,
              renderSideBySide: true,
              wordWrap: "on",
            }}
            height="360px"
          />
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-slate text-body">
            No code snippet available
          </div>
        )}
      </div>
    </div>
  );
}

function monacoLang(lang: string): string {
  const map: Record<string, string> = {
    typescript: "typescript",
    javascript: "javascript",
    go: "go",
    csharp: "csharp",
    python: "python",
    java: "java",
  };
  return map[lang] ?? "plaintext";
}
