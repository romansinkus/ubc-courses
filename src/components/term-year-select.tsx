"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatTermLabel, type TermOption } from "@/lib/terms";

export function TermYearSelect({
  id,
  name,
  defaultValue,
  options,
  required,
}: {
  id: string;
  name: string;
  defaultValue: string;
  options: TermOption[];
  required?: boolean;
}) {
  return (
    <Select name={name} defaultValue={defaultValue} required={required}>
      <SelectTrigger id={id} className="w-full">
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
