const USERNAME_RE = /^[a-zA-Z0-9_]+$/;

export function validateUsername(
  raw: string,
): { ok: true; username: string } | { ok: false; error: string } {
  const username = raw.trim().toLowerCase();

  if (!username) {
    return { ok: false, error: "Choose a username." };
  }
  if (username.length < 3) {
    return { ok: false, error: "Username must be at least 3 characters." };
  }
  if (username.length > 24) {
    return { ok: false, error: "Username must be at most 24 characters." };
  }
  if (!USERNAME_RE.test(username)) {
    return { ok: false, error: "Use only letters, numbers, and underscores." };
  }
  if (username.startsWith("pending_")) {
    return { ok: false, error: "That username is reserved." };
  }

  return { ok: true, username };
}

export function profileNeedsUsername(profile: { usernameSetAt: Date | null }): boolean {
  return profile.usernameSetAt == null;
}
