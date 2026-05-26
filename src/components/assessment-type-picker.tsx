import { cn } from "@/lib/utils";
import { glassSegmentedControlClass, glassSegmentedOptionClass } from "@/lib/glass-styles";

const OPTIONS = [
  { value: "exam", label: "Exam-based" },
  { value: "both", label: "Both" },
  { value: "project", label: "Project-based" },
] as const;

export function AssessmentTypePicker({
  defaultValue = "both",
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
            name="assessmentType"
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

export const ASSESSMENT_TYPE_LABEL: Record<(typeof OPTIONS)[number]["value"], string> = {
  exam: "Exam-based",
  both: "Both",
  project: "Project-based",
};
