export function formatProfessorName(firstName: string, lastName: string): string {
  const first = firstName.trim();
  const last = lastName.trim();
  if (!first || !last) return "";
  return `${first} ${last}`;
}
