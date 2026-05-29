"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { LEVEL_LABEL } from "@/lib/course-filters";
import { formatTermLabel } from "@/lib/terms";

export function ActiveFilterChips({
  selectedSubjects,
  selectedLevels,
  term,
  query,
}: {
  selectedSubjects: string[];
  selectedLevels: string[];
  term: string;
  query?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (selectedSubjects.length === 0 && selectedLevels.length === 0 && term === "all" && !query) {
    return null;
  }

  function pushParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
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

  function removeLevel(level: string) {
    const next = selectedLevels.filter((l) => l !== level);
    pushParams({ level: next.length ? next.join(",") : null });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {query ? (
        <Chip label={`“${query}”`} onRemove={() => pushParams({ q: null })} />
      ) : null}
      {selectedSubjects.map((s) => (
        <Chip key={s} label={s} onRemove={() => removeSubject(s)} />
      ))}
      {selectedLevels.map((level) => (
        <Chip
          key={level}
          label={LEVEL_LABEL[level] ?? level}
          onRemove={() => removeLevel(level)}
        />
      ))}
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
