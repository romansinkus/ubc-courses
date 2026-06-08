import Link from "next/link";
import { User } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { profileNeedsUsername } from "@/lib/username";
import { NavTabs } from "@/components/nav-tabs";
import { glassHeaderClass, glassNavIconButtonClass, glassNavTextLinkClass, glassSiteLogoClass } from "@/lib/glass-styles";
import { cn } from "@/lib/utils";

export async function SiteHeader() {
  const profile = await getCurrentProfile();

  return (
    <header className={cn("sticky top-0 z-40", glassHeaderClass)}>
      <div className="grid h-14 w-full grid-cols-[1fr_auto_1fr] items-center px-6">
        <Link href="/" className={cn(glassSiteLogoClass, "justify-self-start")}>
          UBC-Courses
        </Link>
        <NavTabs
          tabs={[
            { href: "/", label: "Home" },
            { href: "/courses", label: "Browse" },
            { href: "/compare", label: "Compare" },
            { href: "/advisor", label: "Advisor" },
            { href: "/documents", label: "Documents" },
            { href: "/feedback", label: "Feedback" },
          ]}
        />
        <div className="justify-self-end">
          {profile ? (
            profileNeedsUsername(profile) ? (
              <Link href="/welcome" className={glassNavTextLinkClass}>
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
            <Link href="/login" className={glassNavTextLinkClass}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
