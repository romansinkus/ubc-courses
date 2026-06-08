// A template (unlike a layout) remounts its children on every navigation, so
// this wrapper replays the fade each time you switch pages.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-enter">{children}</div>;
}
