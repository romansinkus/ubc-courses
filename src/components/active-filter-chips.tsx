"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { formatTermLabel } from "@/lib/terms";

const LEVEL_LABEL: Record<string, string> = {
  "100": "100-level",
  "200": "200-level",
  "300": "300-level",
  "400": "400-level",
  "500": "500+ (grad)",
};

export function ActiveFilterChips({
  selectedSubjects,
  level,
  term,
  query,
}: {
  selectedSubjects: string[];
  level: string;
  term: string;
  query?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (selectedSubjects.length === 0 && level === "all" && term === "all" && !query) return null;

  function pushParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    router.push(`/courses${qs ? `?${qs}` : ""}`);
  }

  function removeSubject(s: string) {
    const next = selectedSubjects.filter((x) => x !== s);
    pushParams({ subjects: next.length ? next.join(",") : null });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {query ? (
        <Chip label={`“${query}”`} onRemove={() => pushParams({ q: null })} />
      ) : null}
      {selectedSubjects.map((s) => (
        <Chip key={s} label={s} onRemove={() => removeSubject(s)} />
      ))}
      {level !== "all" ? (
        <Chip label={LEVEL_LABEL[level] ?? level} onRemove={() => pushParams({ level: null })} />
      ) : null}
      {term !== "all" ? (
        <Chip label={formatTermLabel(term)} onRemove={() => pushParams({ term: null })} />
      ) : null}
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border bg-muted px-2.5 py-1 text-xs">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="rounded-full p-0.5 hover:bg-foreground/10"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
