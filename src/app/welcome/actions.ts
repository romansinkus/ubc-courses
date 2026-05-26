"use server";

import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { validateUsername } from "@/lib/username";

export async function setUsername(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/welcome");
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login?next=/welcome");
  }
  if (profile.usernameSetAt) {
    redirect(`/u/${profile.username}`);
  }

  const result = validateUsername(String(formData.get("username") ?? ""));
  if (!result.ok) {
    redirect(`/welcome?error=${encodeURIComponent(result.error)}`);
  }

  const [taken] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.username, result.username), ne(profiles.id, user.id)))
    .limit(1);

  if (taken) {
    redirect(`/welcome?error=${encodeURIComponent("That username is already taken.")}`);
  }

  await db
    .update(profiles)
    .set({ username: result.username, usernameSetAt: new Date() })
    .where(eq(profiles.id, user.id));

  const next = String(formData.get("next") ?? "").trim();
  const destination =
    next.startsWith("/") && !next.startsWith("//") ? next : `/u/${result.username}`;
  redirect(destination);
}
