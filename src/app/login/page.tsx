import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LiveBackground } from "@/components/live-background";
import { cn } from "@/lib/utils";
import {
  glassFieldClass,
  glassFormSectionClass,
  glassSubmitButtonClass,
  glassSurfaceClass,
} from "@/lib/glass-styles";
import { signInWithMagicLink } from "./actions";

type SearchParams = Promise<{ sent?: string; error?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { sent, error } = await searchParams;

  return (
    <>
      <LiveBackground />
      <div className="relative mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md flex-col justify-center px-4 py-10">
        <div className={cn(glassSurfaceClass, "rounded-2xl p-6 sm:p-8")}>
          <header className="mb-8 border-b border-white/40 pb-6 dark:border-white/15">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Welcome back
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Sign in to UBCourses
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              We&apos;ll email you a magic link — no password needed. First time signing in? Pick a
              username below.
            </p>
          </header>

          {sent ? (
            <section className={glassFormSectionClass}>
              <p className="text-sm">
                Check your email for the sign-in link. You can close this tab.
              </p>
            </section>
          ) : (
            <form action={signInWithMagicLink} className="space-y-6">
              <section className={glassFormSectionClass}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="you@ubc.ca"
                      className={glassFieldClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">
                      Username <span className="text-muted-foreground">(first sign-in only)</span>
                    </Label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      minLength={3}
                      maxLength={24}
                      placeholder="e.g. john_d"
                      pattern="[a-zA-Z0-9_]+"
                      className={glassFieldClass}
                    />
                  </div>
                </div>
              </section>

              {error ? <p className="text-sm text-red-600">{decodeURIComponent(error)}</p> : null}

              <Button type="submit" className={glassSubmitButtonClass}>
                Send magic link
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                <Link href="/" className="hover:text-foreground transition-colors">
                  Back to home
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
