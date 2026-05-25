"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatTermLabel, type TermOption } from "@/lib/terms";

export function TermFilterSelect({
  value,
  onValueChange,
  options,
}: {
  value: string;
  onValueChange: (value: string | null) => void;
  options: TermOption[];
}) {
  const label = !value || value === "all" ? "Any term" : formatTermLabel(value);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Any term">{label}</SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-72">
        <SelectItem value="all">Any term</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
