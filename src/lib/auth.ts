import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { profileNeedsUsername } from "@/lib/username";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  // Proxy middleware already validates/refreshes the session via getUser(); read
  // the local session here to avoid a second ~350ms round-trip to Supabase Auth.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user ?? null;
});

export const getCurrentProfile = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  try {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
    return profile ?? null;
  } catch {
    return null;
  }
});

export async function requireCompleteProfile(nextPath?: string) {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login");
  }
  if (profileNeedsUsername(profile)) {
    const query = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/welcome${query}`);
  }
  return profile;
}
