"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  glassBarButtonClass,
  glassSearchBarClass,
} from "@/lib/glass-styles";

type Suggestion = { code: string; title: string };

export function SearchBox({
  defaultValue = "",
  placeholder = "Search by code or title (e.g. CPSC 110)",
  variant = "default",
}: {
  defaultValue?: string;
  placeholder?: string;
  variant?: "default" | "glass";
}) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [debouncedQuery, setDebouncedQuery] = useState(defaultValue.trim());
  const [fetchedFor, setFetchedFor] = useState(defaultValue.trim());
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const trimmed = query.trim();
  const isSearching = trimmed.length > 0;
  const displaySuggestions = isSearching ? suggestions : [];
  const displayLoading =
    isSearching && (trimmed !== debouncedQuery || debouncedQuery !== fetchedFor);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(trimmed), 250);
    return () => clearTimeout(timer);
  }, [trimmed]);

  useEffect(() => {
    if (!debouncedQuery) {
      abortRef.current?.abort();
      return;
    }

    abortRef.current?.abort();
    const ctl = new AbortController();
    abortRef.current = ctl;
    let active = true;

    void (async () => {
      try {
        const res = await fetch(`/api/courses/search?q=${encodeURIComponent(debouncedQuery)}`, {
          signal: ctl.signal,
        });
        if (!res.ok || !active) return;
        const data: { results: Suggestion[] } = await res.json();
        if (!active) return;
        setSuggestions(data.results);
        setHighlight(-1);
        setFetchedFor(debouncedQuery);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error(err);
        }
        if (active && (err as Error).name !== "AbortError") {
          setFetchedFor(debouncedQuery);
        }
      }
    })();

    return () => {
      active = false;
      ctl.abort();
    };
  }, [debouncedQuery]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(code: string) {
    setOpen(false);
    router.push(`/courses/${encodeURIComponent(code)}`);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (highlight >= 0 && displaySuggestions[highlight]) {
      e.preventDefault();
      go(displaySuggestions[highlight].code);
      return;
    }
    // Otherwise let the form submit naturally to /courses?q=...
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || displaySuggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % displaySuggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h <= 0 ? displaySuggestions.length - 1 : h - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showDropdown = open && isSearching;
  const noResults =
    isSearching && !displayLoading && debouncedQuery === fetchedFor && suggestions.length === 0;

  function goCreate() {
    setOpen(false);
    router.push(`/courses/new?code=${encodeURIComponent(trimmed)}`);
  }

  const isGlass = variant === "glass";

  return (
    <div ref={containerRef} className="relative flex-1">
      <form
        action="/courses"
        onSubmit={onSubmit}
        autoComplete="off"
        className={cn(
          "flex",
          isGlass ? "gap-0" : "gap-2",
          isGlass && cn("overflow-hidden", glassSearchBarClass),
        )}
      >
        <Input
          name="q"
          value={query}
          onChange={(e) => {
            const value = e.target.value;
            setQuery(value);
            setOpen(true);
            if (!value.trim()) {
              setSuggestions([]);
              setHighlight(-1);
              setFetchedFor("");
            }
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={cn(
            "flex-1",
            isGlass &&
              "h-10 rounded-none border-0 border-r border-white/35 bg-transparent px-3.5 shadow-none focus-visible:border-white/35 focus-visible:ring-0 dark:border-white/10",
          )}
        />
        <Button
          type="submit"
          className={cn(isGlass && glassBarButtonClass)}
        >
          Search
        </Button>
      </form>

      {showDropdown && (displaySuggestions.length > 0 || displayLoading || noResults) && (
        <div
          className={cn(
            "absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border bg-popover shadow-lg",
            isGlass &&
              "border-white/50 bg-background/80 shadow-[0_8px_32px_rgba(0,33,69,0.12)] ring-1 ring-white/50 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 dark:border-white/15 dark:ring-white/10",
          )}
        >
          {displayLoading && displaySuggestions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Searching…</div>
          ) : displaySuggestions.length === 0 ? (
            <div className="p-3 text-sm space-y-2">
              <p className="text-muted-foreground">
                No courses match &ldquo;{trimmed}&rdquo;.
              </p>
              <button
                type="button"
                onClick={goCreate}
                className="flex w-full items-center gap-2 rounded-md border border-dashed px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground"
              >
                <Plus className="h-4 w-4" />
                <span>
                  Add <span className="font-medium">{trimmed.toUpperCase()}</span> to the catalog
                </span>
              </button>
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1 text-left">
              {displaySuggestions.map((s, i) => (
                <li key={s.code}>
                  <button
                    type="button"
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => go(s.code)}
                    className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-sm ${
                      i === highlight ? "bg-accent text-accent-foreground" : ""
                    }`}
                  >
                    <span className="font-medium">{s.code}</span>
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {s.title}
                    </span>
                  </button>
                </li>
              ))}
              <li className="border-t mt-1 pt-1">
                <button
                  type="button"
                  onClick={goCreate}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add a new course</span>
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
