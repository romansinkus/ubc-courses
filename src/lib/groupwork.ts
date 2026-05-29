export const GROUPWORK_VALUES = ["no", "optional", "yes"] as const;

export type Groupwork = (typeof GROUPWORK_VALUES)[number];

export const GROUPWORK_LABEL: Record<Groupwork, string> = {
  no: "No",
  optional: "Optional",
  yes: "Yes",
};

export function groupworkToDb(value: Groupwork): boolean | null {
  if (value === "yes") return true;
  if (value === "no") return false;
  return null;
}

export function groupworkFromDb(value: boolean | null): Groupwork {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "optional";
}
