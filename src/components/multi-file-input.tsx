"use client";

import { useRef, useState } from "react";
import { Paperclip, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
}: {
  name: string;
  accept: string;
  maxFiles?: number;
  maxSizeBytes?: number;
  buttonLabel?: string;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
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
    sync(next);
  }

  function remove(index: number) {
    setError(null);
    sync(files.filter((_, i) => i !== index));
  }

  const atLimit = files.length >= maxFiles;

  return (
    <div className="space-y-2">
      <input ref={submitRef} type="file" name={name} multiple className="hidden" tabIndex={-1} />
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
              className="flex items-center gap-2 rounded-lg border border-input px-2.5 py-1.5 text-sm"
            >
              <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{f.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{formatSize(f.size)}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove ${f.name}`}
                className="shrink-0 rounded-sm text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
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
      >
        <Plus className="h-4 w-4" />
        {buttonLabel}
      </Button>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
