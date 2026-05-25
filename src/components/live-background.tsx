export function LiveBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-ubc-blue-100/25 via-background to-ubc-blue-200/15"
    >
      <div className="animate-drift-1 absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-ubc-blue-300/35 blur-3xl" />
      <div className="animate-drift-2 absolute top-24 -right-40 h-[36rem] w-[36rem] rounded-full bg-ubc-blue-500/25 blur-3xl" />
      <div className="animate-drift-3 absolute -bottom-40 left-1/4 h-[30rem] w-[30rem] rounded-full bg-ubc-blue-400/20 blur-3xl" />
      <div className="animate-drift-4 absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ubc-blue/[0.12] blur-3xl" />
    </div>
  );
}
