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
import { glassFieldClass, glassSurfaceClass } from "@/lib/glass-styles";

export function ProfessorPicker({
  profs,
  variant = "default",
}: {
  profs: string[];
  variant?: "default" | "glass";
}) {
  const [query, setQuery] = useState("");
  const [selectedProfessor, setSelectedProfessor] = useState<string | null>(null);
  const [filtered, setFiltered] = useState<string[]>(profs);
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const isGlass = variant === "glass";

  useEffect(() => {
    const trimmed = query.trim().toLowerCase();
    const timer = setTimeout(() => {
      if (!trimmed) {
        setFiltered(profs);
      } else {
        setFiltered(profs.filter((p) => p.toLowerCase().includes(trimmed)));
      }
      setHighlight(-1);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, profs]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const trimmedQuery = query.trim();
  const showDropdown =
    !selectedProfessor && open && (filtered.length > 0 || trimmedQuery.length >= 0);

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
    setFirstName("");
    setLastName("");
    setAddOpen(true);
    setOpen(false);
  }

  function confirmAddProfessor() {
    const fullName = formatProfessorName(firstName, lastName);
    if (!fullName) {
      setAddError("Enter both a first name and last name.");
      return;
    }

    const existing = profs.find((p) => p.toLowerCase() === fullName.toLowerCase());
    pick(existing ?? fullName);
    setAddOpen(false);
    setFirstName("");
    setLastName("");
    setAddError(null);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown) return;
    const total = filtered.length + 1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % total);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h <= 0 ? total - 1 : h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlight >= 0 && highlight < filtered.length) {
        pick(filtered[highlight]);
      } else {
        openAddDialog();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <>
      <input type="hidden" name="professor" value={selectedProfessor ?? ""} required />

      <div ref={containerRef} className="relative">
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
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
              placeholder={profs.length > 0 ? "Search professors" : "Search or add a professor"}
              autoComplete="off"
              required
              className={isGlass ? glassFieldClass : undefined}
            />
            {showDropdown && (
              <div
                className={cn(
                  "absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border shadow-lg",
                  isGlass
                    ? cn(glassSurfaceClass, "bg-background/80")
                    : "border bg-popover",
                )}
              >
                <ul className="max-h-72 overflow-y-auto py-1 text-left text-sm">
                  {filtered.length === 0 && trimmedQuery.length > 0 ? (
                    <li className="px-3 py-2 text-muted-foreground">No matches.</li>
                  ) : (
                    filtered.map((p, i) => (
                      <li key={p}>
                        <button
                          type="button"
                          onMouseEnter={() => setHighlight(i)}
                          onClick={() => pick(p)}
                          className={`flex w-full items-center px-3 py-2 ${
                            i === highlight ? "bg-accent text-accent-foreground" : ""
                          }`}
                        >
                          {p}
                        </button>
                      </li>
                    ))
                  )}
                  <li className={filtered.length > 0 ? "mt-1 border-t pt-1" : ""}>
                    <button
                      type="button"
                      onMouseEnter={() => setHighlight(filtered.length)}
                      onClick={openAddDialog}
                      className={`flex w-full items-center gap-2 px-3 py-2 ${
                        highlight === filtered.length ? "bg-accent text-accent-foreground" : ""
                      }`}
                    >
                      <Plus className="h-4 w-4" />
                      Add a professor
                    </button>
                  </li>
                </ul>
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
                required
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
                required
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
