import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { profileNeedsUsername } from "@/lib/username";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const [profile] = await db
          .select({ usernameSetAt: profiles.usernameSetAt })
          .from(profiles)
          .where(eq(profiles.id, user.id))
          .limit(1);

        if (profile && profileNeedsUsername(profile)) {
          const welcomeUrl = new URL("/welcome", origin);
          if (next !== "/") {
            welcomeUrl.searchParams.set("next", next);
          }
          return NextResponse.redirect(welcomeUrl);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
