import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "exam", label: "Exam-based" },
  { value: "both", label: "Both" },
  { value: "project", label: "Project-based" },
] as const;

export function AssessmentTypePicker({
  defaultValue = "both",
}: {
  defaultValue?: (typeof OPTIONS)[number]["value"];
}) {
  return (
    <div className="flex rounded-lg border bg-muted/40 p-1">
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
              "peer-checked:bg-background peer-checked:text-foreground peer-checked:shadow-sm",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
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
