import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LiveBackground } from "@/components/live-background";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { profileNeedsUsername } from "@/lib/username";
import { cn } from "@/lib/utils";
import {
  glassFieldClass,
  glassFormSectionClass,
  glassSubmitButtonClass,
  glassSurfaceClass,
} from "@/lib/glass-styles";
import { setUsername } from "./actions";

type SearchParams = Promise<{ error?: string; next?: string }>;

export default async function WelcomePage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/welcome");
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login?next=/welcome");
  }
  if (!profileNeedsUsername(profile)) {
    redirect(`/u/${profile.username}`);
  }

  const { error, next } = await searchParams;

  return (
    <>
      <LiveBackground />
      <div className="relative mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md flex-col justify-center px-4 py-10">
        <div className={cn(glassSurfaceClass, "rounded-2xl p-6 sm:p-8")}>
          <header className="mb-8 border-b border-white/40 pb-6 dark:border-white/15">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Almost there
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Choose your username
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              This is how other students will see you on reviews.
            </p>
          </header>

          <form action={setUsername} className="space-y-6">
            {next ? <input type="hidden" name="next" value={next} /> : null}

            <section className={glassFormSectionClass}>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  minLength={3}
                  maxLength={24}
                  placeholder="e.g. john_d"
                  pattern="[a-zA-Z0-9_]+"
                  autoComplete="username"
                  className={glassFieldClass}
                />
                <p className="text-xs text-muted-foreground">
                  3–24 characters. Letters, numbers, and underscores only.
                </p>
              </div>
            </section>

            {error ? <p className="text-sm text-red-600">{decodeURIComponent(error)}</p> : null}

            <Button type="submit" className={glassSubmitButtonClass}>
              Continue
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
