import type { Metadata } from "next";
import { LiveBackground } from "@/components/live-background";
import { cn } from "@/lib/utils";
import { glassSurfaceClass } from "@/lib/glass-styles";

export const metadata: Metadata = {
  title: "Advisor",
  description: "Ask an AI advisor about UBC courses and get suggestions for what to take.",
  alternates: { canonical: "/advisor" },
  robots: { index: false, follow: true },
};

export default function AdvisorPage() {
  return (
    <>
      <LiveBackground />
      <div className="relative mx-auto max-w-3xl px-4 py-10 pb-16">
        <div className={cn(glassSurfaceClass, "space-y-4 rounded-2xl p-6 sm:p-8")}>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Advisor</h1>
            <span className="inline-flex items-center rounded-full border border-ubc-blue-300/60 bg-background/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              In development
            </span>
          </div>
          <p className="text-muted-foreground">
            Chat with an AI advisor about UBC courses — ask questions and get suggestions for what
            to take.
          </p>
          <p className="text-sm text-muted-foreground">
            This feature is still in development and isn&apos;t available yet. Check back soon.
          </p>
        </div>
      </div>
    </>
  );
}
