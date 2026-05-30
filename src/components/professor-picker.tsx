"use client";

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatProfessorName } from "@/lib/professor-name";
import { cn } from "@/lib/utils";
import { glassFieldClass, glassFileRowClass } from "@/lib/glass-styles";

export function ProfessorPicker({
  variant = "default",
  defaultProfessor = null,
}: {
  variant?: "default" | "glass";
  defaultProfessor?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [fetchedFor, setFetchedFor] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedProfessor, setSelectedProfessor] = useState<string | null>(defaultProfessor);
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isGlass = variant === "glass";

  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length > 0;
  const loading = isSearching && (trimmedQuery !== debouncedQuery || debouncedQuery !== fetchedFor);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(trimmedQuery), 250);
    return () => clearTimeout(timer);
  }, [trimmedQuery]);

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
        const res = await fetch(`/api/professors/search?q=${encodeURIComponent(debouncedQuery)}`, {
          signal: ctl.signal,
        });
        if (!res.ok || !active) return;
        const data: { results: string[] } = await res.json();
        if (!active) return;
        setSuggestions(data.results);
        setHighlight(-1);
        setFetchedFor(debouncedQuery);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error(err);
          if (active) setFetchedFor(debouncedQuery);
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

  const showDropdown = !selectedProfessor && open && isSearching;
  const searchSettled = isSearching && !loading && debouncedQuery === fetchedFor;
  const noMatches = searchSettled && suggestions.length === 0;

  function pick(prof: string) {
    setSelectedProfessor(prof);
    setQuery("");
    setOpen(false);
  }

  function clearSelection() {
    setSelectedProfessor(null);
    setQuery("");
    setOpen(false);
  }

  function openAddDialog() {
    setAddError(null);
    const parts = trimmedQuery.split(/\s+/);
    if (parts.length >= 2) {
      setFirstName(parts[0] ?? "");
      setLastName(parts.slice(1).join(" "));
    } else {
      setFirstName(trimmedQuery);
      setLastName("");
    }
    setAddOpen(true);
    setOpen(false);
  }

  function confirmAddProfessor() {
    const fullName = formatProfessorName(firstName, lastName);
    if (!fullName) {
      setAddError("Enter both a first name and last name.");
      return;
    }

    const existing = suggestions.find((p) => p.toLowerCase() === fullName.toLowerCase());
    pick(existing ?? fullName);
    setAddOpen(false);
    setFirstName("");
    setLastName("");
    setAddError(null);
  }

  const dropdownPanelClass = cn(
    "absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg",
    isGlass && "border-ubc-blue-300/60 ring-1 ring-white/60 dark:border-white/30 dark:ring-white/10",
  );

  const dropdownItemClass = (active: boolean) =>
    cn(
      "flex w-full items-center px-3 py-2 text-left text-sm transition-colors",
      active
        ? "bg-accent text-accent-foreground"
        : "hover:bg-accent hover:text-accent-foreground",
    );

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "Enter" && noMatches) {
      e.preventDefault();
      openAddDialog();
      return;
    }
    if (!showDropdown) return;
    const total = suggestions.length;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (total === 0 ? -1 : (h + 1) % total));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (total === 0 ? -1 : h <= 0 ? total - 1 : h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlight >= 0 && highlight < suggestions.length) {
        pick(suggestions[highlight]);
      } else if (noMatches) {
        openAddDialog();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <>
      <input type="hidden" name="professor" value={selectedProfessor ?? ""} required />

      <div ref={containerRef} className={cn("relative", open && !selectedProfessor && "z-50")}>
        {selectedProfessor ? (
            <div
              className={cn(
                "flex h-8 items-center gap-2 rounded-lg border px-2.5",
                isGlass ? glassFieldClass : "border-input",
              )}
            >
              <span id="professor" className="min-w-0 flex-1 truncate text-sm">
                {selectedProfessor}
              </span>
              <button
                type="button"
                onClick={clearSelection}
                className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <Input
                id="professor"
                type="text"
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
                placeholder="Search or add a professor"
                autoComplete="off"
                className={isGlass ? glassFieldClass : undefined}
              />
              {showDropdown && (
                <div className={dropdownPanelClass}>
                  {loading && suggestions.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-muted-foreground">Searching…</p>
                  ) : noMatches ? (
                    <div className="space-y-2 p-2">
                      <p className="px-1 text-xs leading-snug text-muted-foreground">
                        No matches for &ldquo;{trimmedQuery}&rdquo;
                      </p>
                      <button
                        type="button"
                        onClick={openAddDialog}
                        className={cn(
                          "flex w-full items-center gap-2 text-sm font-medium transition-colors hover:bg-muted/50",
                          isGlass
                            ? glassFileRowClass
                            : "rounded-lg border border-input bg-muted/30 px-3 py-2",
                        )}
                      >
                        <Plus className="h-4 w-4 shrink-0 text-primary" />
                        Add professor
                      </button>
                    </div>
                  ) : (
                    <ul className="max-h-72 overflow-y-auto py-1">
                      {suggestions.map((p, i) => (
                        <li key={p}>
                          <button
                            type="button"
                            onMouseEnter={() => setHighlight(i)}
                            onClick={() => pick(p)}
                            className={dropdownItemClass(i === highlight)}
                          >
                            {p}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Add a professor</DialogTitle>
            <DialogDescription>
              Enter their name to attach to your review. The professor is only saved when you
              submit the review.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="professor-first-name">First name</Label>
              <Input
                id="professor-first-name"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  setAddError(null);
                }}
                autoComplete="given-name"
                maxLength={60}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="professor-last-name">Last name</Label>
              <Input
                id="professor-last-name"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  setAddError(null);
                }}
                autoComplete="family-name"
                maxLength={60}
              />
            </div>
            {addError ? <p className="text-sm text-red-600">{addError}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmAddProfessor}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
