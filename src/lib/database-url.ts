/**
 * postgres.js parses DATABASE_URL with the URL constructor. Unencoded `#` in the
 * password is treated as a fragment delimiter and throws ERR_INVALID_URL.
 */
export function normalizeDatabaseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;

  try {
    new URL(trimmed);
    return trimmed;
  } catch {
    const match = trimmed.match(/^(postgres(?:ql)?:\/\/)([^@/]+)@(.+)$/i);
    if (!match) {
      throw new Error("DATABASE_URL is not a valid Postgres connection string");
    }

    const [, protocol, userInfo, hostPart] = match;
    const colonIndex = userInfo.indexOf(":");

    if (colonIndex === -1) {
      throw new Error("DATABASE_URL must include a username and password");
    }

    const username = userInfo.slice(0, colonIndex);
    const password = userInfo.slice(colonIndex + 1);

    return `${protocol}${username}:${encodeURIComponent(password)}@${hostPart}`;
  }
}
