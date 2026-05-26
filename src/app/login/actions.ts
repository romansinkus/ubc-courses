"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signInWithMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const next = String(formData.get("next") ?? "").trim();

  if (!email) {
    redirect("/login?error=missing_email");
  }

  const supabase = await createClient();
  const headerList = await headers();
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const originHeader = headerList.get("origin");
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  const origin =
    configuredSiteUrl ??
    originHeader ??
    (host ? `${protocol}://${host}` : "http://localhost:3000");

  const callbackUrl = new URL("/auth/callback", origin);
  if (next.startsWith("/") && !next.startsWith("//")) {
    callbackUrl.searchParams.set("next", next);
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: callbackUrl.toString(),
    },
  });

  if (error) {
    const params = new URLSearchParams({ error: error.message });
    if (next.startsWith("/") && !next.startsWith("//")) {
      params.set("next", next);
    }
    redirect(`/login?${params.toString()}`);
  }

  const sentParams = new URLSearchParams({ sent: "1" });
  if (next.startsWith("/") && !next.startsWith("//")) {
    sentParams.set("next", next);
  }
  redirect(`/login?${sentParams.toString()}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
