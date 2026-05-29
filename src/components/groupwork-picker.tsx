import { cn } from "@/lib/utils";
import { glassSegmentedControlClass, glassSegmentedOptionClass } from "@/lib/glass-styles";
import { GROUPWORK_LABEL, type Groupwork } from "@/lib/groupwork";

const OPTIONS: { value: Groupwork; label: string }[] = (
  ["no", "optional", "yes"] as const
).map((value) => ({
  value,
  label: GROUPWORK_LABEL[value],
}));

export function GroupworkPicker({
  defaultValue = "optional",
  variant = "default",
}: {
  defaultValue?: Groupwork;
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
            name="groupwork"
            value={opt.value}
            defaultChecked={defaultValue === opt.value}
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
