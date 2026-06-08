import type { Metadata } from "next";
import { LiveBackground } from "@/components/live-background";
import { FeedbackForm } from "@/components/feedback-form";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { glassSurfaceClass } from "@/lib/glass-styles";

export const metadata: Metadata = {
  title: "Feedback",
  description: "Share feedback, report a bug, or suggest a feature for UBC-Courses.",
  alternates: { canonical: "/feedback" },
};

export default async function FeedbackPage() {
  const user = await getCurrentUser();

  return (
    <>
      <LiveBackground />
      <div className="relative mx-auto max-w-2xl px-4 py-10 pb-16">
        <div className={cn(glassSurfaceClass, "space-y-5 rounded-2xl p-6 sm:p-8")}>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Feedback</h1>
            <p className="text-muted-foreground">
              Found a bug, have an idea, or just want to share your thoughts? Let us know — it all
              helps.
            </p>
          </div>
          <FeedbackForm
            isSignedIn={user != null}
            loginHref={`/login?next=${encodeURIComponent("/feedback")}`}
          />
        </div>
      </div>
    </>
  );
}
