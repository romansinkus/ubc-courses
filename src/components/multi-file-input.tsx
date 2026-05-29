"use client";

import { useRef, useState } from "react";
import { Paperclip, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { glassFileRowClass, glassOutlineButtonClass } from "@/lib/glass-styles";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function MultiFileInput({
  name,
  accept,
  maxFiles = 5,
  maxSizeBytes = 5 * 1024 * 1024,
  buttonLabel = "Add file",
  variant = "default",
  descriptionName,
  descriptionLabel = "Name",
  descriptionPlaceholder = "Add a description (optional)",
  descriptionRequired = false,
}: {
  name: string;
  accept: string;
  maxFiles?: number;
  maxSizeBytes?: number;
  buttonLabel?: string;
  variant?: "default" | "glass";
  /** When set, renders a text input per file submitted under this field name. */
  descriptionName?: string;
  descriptionLabel?: string;
  descriptionPlaceholder?: string;
  descriptionRequired?: boolean;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [descriptions, setDescriptions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const withDescriptions = !!descriptionName;
  // Hidden input that actually gets submitted with the form. We keep its
  // FileList in sync with `files` via DataTransfer so the server action reads
  // them under `name` exactly as a native multi-file input would.
  const submitRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);

  function sync(next: File[]) {
    const dt = new DataTransfer();
    next.forEach((f) => dt.items.add(f));
    if (submitRef.current) submitRef.current.files = dt.files;
    setFiles(next);
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = ""; // let the same file be re-picked after removal
    if (picked.length === 0) return;

    const next = [...files];
    let nextError: string | null = null;
    for (const f of picked) {
      if (next.length >= maxFiles) {
        nextError = `You can attach at most ${maxFiles} files.`;
        break;
      }
      if (f.size > maxSizeBytes) {
        nextError = `"${f.name}" is larger than ${formatSize(maxSizeBytes)}.`;
        continue;
      }
      if (next.some((x) => x.name === f.name && x.size === f.size)) continue; // de-dupe
      next.push(f);
    }
    setError(nextError);
    const addedCount = next.length - files.length;
    if (addedCount > 0) {
      setDescriptions((prev) => [...prev, ...Array<string>(addedCount).fill("")]);
    }
    sync(next);
  }

  function remove(index: number) {
    setError(null);
    setDescriptions((prev) => prev.filter((_, i) => i !== index));
    sync(files.filter((_, i) => i !== index));
  }

  const atLimit = files.length >= maxFiles;
  const isGlass = variant === "glass";

  return (
    <div className="space-y-2">
      <input
        ref={submitRef}
        type="file"
        name={name}
        multiple={maxFiles > 1}
        className="hidden"
        tabIndex={-1}
      />
      <input
        ref={pickerRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        tabIndex={-1}
        onChange={onPick}
      />

      {files.length > 0 ? (
        <ul className="space-y-1.5">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${f.size}-${i}`}
              className={cn(
                "text-sm",
                withDescriptions ? "flex flex-col gap-2" : "flex items-center gap-2",
                isGlass ? glassFileRowClass : "rounded-lg border border-input px-2.5 py-1.5",
              )}
            >
              <div className="flex w-full min-w-0 items-center gap-2">
                <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate" title={f.name}>
                  {f.name}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatSize(f.size)}</span>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label={`Remove ${f.name}`}
                  className="shrink-0 rounded-sm text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {withDescriptions ? (
                <label className="flex items-center gap-2 pl-[1.375rem]">
                  <span className="shrink-0 text-xs font-medium text-muted-foreground">
                    {descriptionLabel}
                    {descriptionRequired ? <span className="text-red-600"> *</span> : null}
                  </span>
                  <input
                    type="text"
                    name={descriptionName}
                    required={descriptionRequired}
                    value={descriptions[i] ?? ""}
                    onChange={(e) =>
                      setDescriptions((prev) =>
                        prev.map((d, idx) => (idx === i ? e.target.value : d)),
                      )
                    }
                    placeholder={descriptionPlaceholder}
                    maxLength={200}
                    aria-label={`${descriptionLabel} for ${f.name}`}
                    className="min-w-0 flex-1 rounded-md border border-ubc-blue-300/60 bg-background/80 px-2.5 py-1.5 text-sm shadow-[inset_0_1px_2px_rgba(0,33,69,0.06)] outline-none placeholder:text-muted-foreground/80 focus-visible:border-ubc-blue-400 focus-visible:ring-2 focus-visible:ring-ubc-blue-400/30 dark:border-white/25 dark:bg-background/40"
                  />
                </label>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={atLimit}
        onClick={() => pickerRef.current?.click()}
        className={isGlass ? glassOutlineButtonClass : undefined}
      >
        <Plus className="h-4 w-4" />
        {buttonLabel}
      </Button>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
