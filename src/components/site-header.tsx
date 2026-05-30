import Link from "next/link";
import { Compass, User } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { profileNeedsUsername } from "@/lib/username";
import { glassHeaderClass, glassNavIconButtonClass, glassNavLinkClass, glassSiteLogoClass } from "@/lib/glass-styles";
import { cn } from "@/lib/utils";

export async function SiteHeader() {
  const profile = await getCurrentProfile();

  return (
    <header className={cn("sticky top-0 z-40", glassHeaderClass)}>
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className={glassSiteLogoClass}>
          UBC-Courses
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/courses" className={glassNavLinkClass}>
            <Compass aria-hidden="true" />
            Browse
          </Link>
          {profile ? (
            profileNeedsUsername(profile) ? (
              <Link href="/welcome" className={glassNavLinkClass}>
                <User aria-hidden="true" />
                Finish setup
              </Link>
            ) : (
              <Link
                href={`/u/${profile.username}`}
                aria-label={`Open your profile, @${profile.username}`}
                title={`@${profile.username}`}
                className={glassNavIconButtonClass}
              >
                <User aria-hidden="true" />
              </Link>
            )
          ) : (
            <Link href="/login" className={glassNavLinkClass}>
              <User aria-hidden="true" />
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
