export const glassSurfaceClass =
  "rounded-xl border border-white/55 bg-background/60 shadow-[0_8px_32px_rgba(0,33,69,0.16),inset_0_1px_0_rgba(255,255,255,0.45)] ring-1 ring-white/65 backdrop-blur-xl supports-[backdrop-filter]:bg-background/45 dark:border-white/20 dark:bg-background/30 dark:ring-white/12";

export const glassSearchBarHoverClass =
  "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.01] hover:border-white/75 hover:bg-background/72 hover:shadow-[0_12px_40px_rgba(0,33,69,0.22),inset_0_1px_0_rgba(255,255,255,0.55)] focus-within:-translate-y-0.5 focus-within:scale-[1.01] focus-within:border-white/75 focus-within:bg-background/72 focus-within:shadow-[0_12px_40px_rgba(0,33,69,0.22),inset_0_1px_0_rgba(255,255,255,0.55)] active:translate-y-0 active:scale-[0.995] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 motion-reduce:focus-within:translate-y-0 motion-reduce:focus-within:scale-100";

export const glassSearchBarClass = `${glassSurfaceClass} ${glassSearchBarHoverClass}`;

export const glassFiltersSurfaceClass =
  "rounded-xl border-2 border-primary/75 bg-background/30 shadow-[0_8px_32px_rgba(0,33,69,0.1),inset_0_1px_0_rgba(255,255,255,0.35)] ring-1 ring-primary/10 backdrop-blur-xl supports-[backdrop-filter]:bg-background/20 dark:border-primary/55 dark:bg-background/15 dark:ring-primary/10";

export const primaryActionButtonClass =
  "bg-primary text-primary-foreground shadow-none transition-all duration-200 ease-out hover:brightness-110 hover:saturate-110 hover:shadow-sm active:scale-[0.98] active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:active:scale-100";

export const glassBarButtonClass = `${primaryActionButtonClass} h-10 shrink-0 rounded-none rounded-r-[calc(var(--radius-xl)-1px)] px-4 hover:translate-y-0 hover:scale-100`;

export const glassFiltersButtonClass =
  "h-10 gap-1.5 px-3.5 text-foreground shadow-none transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.03] hover:border-primary hover:bg-background/45 hover:shadow-[0_12px_40px_rgba(0,33,69,0.16),inset_0_1px_0_rgba(255,255,255,0.45)] active:translate-y-0 active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 [&_svg]:transition-transform [&_svg]:duration-200 hover:[&_svg]:rotate-12 motion-reduce:hover:[&_svg]:rotate-0";

export const glassHeaderClass =
  "border-b border-white/45 bg-background/55 shadow-[0_4px_24px_rgba(0,33,69,0.08),inset_0_1px_0_rgba(255,255,255,0.4)] ring-1 ring-inset ring-white/35 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 dark:border-white/15 dark:ring-white/10";

export const glassNavLinkClass = `${primaryActionButtonClass} inline-flex h-10 items-center gap-1.5 rounded-xl px-3.5 text-sm font-medium hover:-translate-y-0.5 hover:scale-[1.03] motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 [&_svg]:size-4 [&_svg]:shrink-0`;

export const glassNavIconButtonClass = `${primaryActionButtonClass} inline-flex h-10 w-10 items-center justify-center rounded-xl hover:-translate-y-0.5 hover:scale-[1.03] motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 [&_svg]:size-[1.125rem]`;
