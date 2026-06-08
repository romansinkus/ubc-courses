import type { Metadata } from "next";
import { LiveBackground } from "@/components/live-background";
import { cn } from "@/lib/utils";
import { glassSurfaceClass } from "@/lib/glass-styles";

export const metadata: Metadata = {
  title: "Documents",
  description: "Browse crowd-sourced course documents — syllabi, notes, and files.",
  alternates: { canonical: "/documents" },
  robots: { index: false, follow: true },
};

export default function DocumentsPage() {
  return (
    <>
      <LiveBackground />
      <div className="relative mx-auto max-w-3xl px-4 py-10 pb-16">
        <div className={cn(glassSurfaceClass, "space-y-4 rounded-2xl p-6 sm:p-8")}>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
            <span className="inline-flex items-center rounded-full border border-ubc-blue-300/60 bg-background/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              In development
            </span>
          </div>
          <p className="text-muted-foreground">
            Browse crowd-sourced course documents — syllabi, notes, and other files shared across
            courses, all in one place.
          </p>
          <p className="text-sm text-muted-foreground">
            This feature is still in development and isn&apos;t available yet. Check back soon.
          </p>
        </div>
      </div>
    </>
  );
}
