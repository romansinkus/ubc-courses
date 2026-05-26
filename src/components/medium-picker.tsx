import { cn } from "@/lib/utils";
import { glassSegmentedControlClass, glassSegmentedOptionClass } from "@/lib/glass-styles";

const OPTIONS = [
  { value: "in_person", label: "In-person" },
  { value: "hybrid", label: "Hybrid" },
  { value: "online", label: "Online" },
] as const;

export function MediumPicker({
  defaultValue = "hybrid",
  variant = "default",
}: {
  defaultValue?: (typeof OPTIONS)[number]["value"];
  variant?: "default" | "glass";
}) {
  const isGlass = variant === "glass";

  return (
    <div
      className={cn(
        "flex rounded-lg border p-1",
        isGlass ? glassSegmentedControlClass : "border bg-muted/40",
      )}
    >
      {OPTIONS.map((opt) => (
        <label key={opt.value} className="flex-1 cursor-pointer">
          <input
            type="radio"
            name="medium"
            value={opt.value}
            defaultChecked={opt.value === defaultValue}
            required
            className="peer sr-only"
          />
          <span
            className={cn(
              "block rounded-md px-2 py-2 text-center text-sm font-medium text-muted-foreground transition-colors",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
              isGlass
                ? cn("peer-checked:text-foreground", glassSegmentedOptionClass)
                : "peer-checked:bg-background peer-checked:text-foreground peer-checked:shadow-sm",
            )}
          >
            {opt.label}
          </span>
        </label>
      ))}
    </div>
  );
}

export const MEDIUM_LABEL: Record<(typeof OPTIONS)[number]["value"], string> = {
  in_person: "In-person",
  hybrid: "Hybrid",
  online: "Online",
};
