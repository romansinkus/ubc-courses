"use client";

import {
  createContext,
  useContext,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { courseBrowsePath } from "@/lib/course-filters";

type CoursesBrowseNavContextValue = {
  isPending: boolean;
  pushParams: (updates: Record<string, string | null>, basePath?: string) => void;
};

const CoursesBrowseNavContext = createContext<CoursesBrowseNavContextValue | null>(null);

export function CoursesBrowseNavProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function pushParams(updates: Record<string, string | null>, basePath = "/courses") {
    const href = courseBrowsePath(searchParams, updates, basePath);
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <CoursesBrowseNavContext.Provider value={{ isPending, pushParams }}>
      {children}
    </CoursesBrowseNavContext.Provider>
  );
}

export function useCoursesBrowseNav(basePath = "/courses") {
  const context = useContext(CoursesBrowseNavContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  if (context) {
    return {
      isPending: context.isPending,
      pushParams: (updates: Record<string, string | null>) =>
        context.pushParams(updates, basePath),
    };
  }

  return {
    isPending,
    pushParams(updates: Record<string, string | null>) {
      const href = courseBrowsePath(searchParams, updates, basePath);
      startTransition(() => {
        router.push(href);
      });
    },
  };
}
