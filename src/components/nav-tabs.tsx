"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Tab = { href: string; label: string };

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavTabs({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname();
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());
  // Skip the slide animation on the very first measurement so the underline
  // simply appears under the active tab instead of sweeping in on load.
  const firstRun = useRef(true);
  const [bar, setBar] = useState({ left: 0, width: 0, active: false, animate: false });

  const activeHref = tabs.find((t) => isActive(t.href, pathname))?.href ?? null;

  useEffect(() => {
    function measure() {
      const el = activeHref ? linkRefs.current.get(activeHref) : null;
      if (!el) {
        setBar((prev) => ({ ...prev, active: false, animate: !firstRun.current }));
      } else {
        setBar({
          left: el.offsetLeft,
          width: el.offsetWidth,
          active: true,
          animate: !firstRun.current,
        });
      }
      firstRun.current = false;
    }

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeHref]);

  return (
    <div className="relative flex items-center gap-4">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          ref={(el) => {
            if (el) linkRefs.current.set(t.href, el);
            else linkRefs.current.delete(t.href);
          }}
          className={cn(
            "relative inline-block text-lg font-semibold tracking-tight transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.03] hover:text-primary motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100",
            t.href === activeHref ? "text-primary" : "text-foreground",
          )}
        >
          {t.label}
        </Link>
      ))}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -bottom-1 h-0.5 rounded-full bg-primary",
          bar.active ? "opacity-100" : "opacity-0",
          bar.animate &&
            "transition-[left,width,opacity] duration-300 ease-out motion-reduce:transition-none",
        )}
        style={{ left: bar.left, width: bar.width }}
      />
    </div>
  );
}
