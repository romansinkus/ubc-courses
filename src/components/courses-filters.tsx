"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { generateTermOptions } from "@/lib/terms";
import { TermFilterSelect } from "@/components/term-filter-select";

const LEVELS = [
  { value: "all", label: "Any level" },
  { value: "100", label: "100-level" },
  { value: "200", label: "200-level" },
  { value: "300", label: "300-level" },
  { value: "400", label: "400-level" },
  { value: "500", label: "500+ (grad)" },
];

export function CoursesFilters({
  subjects,
  selectedSubjects,
  level,
  term,
  basePath = "/courses",
}: {
  subjects: string[];
  selectedSubjects: string[];
  level: string;
  term: string;
  basePath?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subjectQuery, setSubjectQuery] = useState("");
  const termOptions = useMemo(() => generateTermOptions(), []);

  function pushParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    router.push(`${basePath}${qs ? `?${qs}` : ""}`);
  }

  function toggleSubject(subject: string, checked: boolean) {
    const next = checked
      ? Array.from(new Set([...selectedSubjects, subject]))
      : selectedSubjects.filter((s) => s !== subject);
    pushParams({ subjects: next.length ? next.join(",") : null });
  }

  function setLevel(value: string | null) {
    pushParams({ level: !value || value === "all" ? null : value });
  }

  function setTerm(value: string | null) {
    pushParams({ term: !value || value === "all" ? null : value });
  }

  function clearAll() {
    pushParams({ subjects: null, level: null, term: null });
  }

  const activeCount =
    selectedSubjects.length + (level !== "all" ? 1 : 0) + (term !== "all" ? 1 : 0);

  const filteredSubjects = useMemo(() => {
    const q = subjectQuery.trim().toUpperCase();
    if (!q) return subjects;
    return subjects.filter((s) => s.includes(q));
  }, [subjectQuery, subjects]);

  return (
    <aside className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Filters</h2>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
          >
            Clear all
          </button>
        ) : null}
      </div>

      <FilterSection title="Subject">
        <Input
          type="search"
          value={subjectQuery}
          onChange={(e) => setSubjectQuery(e.target.value)}
          placeholder="Find a subject"
          className="h-8 text-sm"
        />
        <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {filteredSubjects.length === 0 ? (
            <li className="text-xs text-muted-foreground">No subjects match.</li>
          ) : (
            filteredSubjects.map((s) => {
              const checked = selectedSubjects.includes(s);
              const id = `subj-${s}`;
              return (
                <li key={s} className="flex items-center gap-2">
                  <Checkbox
                    id={id}
                    checked={checked}
                    onCheckedChange={(c) => toggleSubject(s, c === true)}
                  />
                  <label
                    htmlFor={id}
                    className="text-sm leading-none cursor-pointer select-none"
                  >
                    {s}
                  </label>
                </li>
              );
            })
          )}
        </ul>
      </FilterSection>

      <FilterSection title="Course level">
        <RadioGroup value={level} onValueChange={setLevel} className="space-y-2">
          {LEVELS.map((lvl) => {
            const id = `lvl-${lvl.value}`;
            return (
              <div key={lvl.value} className="flex items-center gap-2">
                <RadioGroupItem id={id} value={lvl.value} />
                <label
                  htmlFor={id}
                  className="text-sm leading-none cursor-pointer select-none"
                >
                  {lvl.label}
                </label>
              </div>
            );
          })}
        </RadioGroup>
      </FilterSection>

      <FilterSection title="Term">
        <TermFilterSelect value={term} onValueChange={setTerm} options={termOptions} />
      </FilterSection>
    </aside>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
