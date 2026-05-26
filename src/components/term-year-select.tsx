"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatTermLabel, type TermOption } from "@/lib/terms";
import { cn } from "@/lib/utils";
import { glassFieldClass } from "@/lib/glass-styles";

export function TermYearSelect({
  id,
  name,
  defaultValue,
  options,
  required,
  variant = "default",
}: {
  id: string;
  name: string;
  defaultValue: string;
  options: TermOption[];
  required?: boolean;
  variant?: "default" | "glass";
}) {
  const isGlass = variant === "glass";

  return (
    <Select name={name} defaultValue={defaultValue} required={required}>
      <SelectTrigger
        id={id}
        className={cn("w-full", isGlass && glassFieldClass)}
      >
        <SelectValue>{(value: string) => formatTermLabel(value)}</SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
