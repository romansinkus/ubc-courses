import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
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
