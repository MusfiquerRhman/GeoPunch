export type DashboardIconName = "users" | "check" | "clock" | "clipboard" | "download" | "refresh" | "arrow" | "calendar" | "close" | "shield" | "rejected";

const paths: Record<DashboardIconName, React.ReactNode> = {
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /><circle cx="9" cy="7" r="4" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  clipboard: <><rect x="5" y="5" width="14" height="16" rx="2" /><rect x="9" y="2" width="6" height="5" rx="1" /><path d="M9 12h6m-6 4h6" /></>,
  download: <><path d="M12 3v12m-5-5 5 5 5-5M4 15v5h16v-5" /></>,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5M6.1 7a7 7 0 0 1 11.55-2.1L20 8M4 16l2.35 3.1A7 7 0 0 0 17.9 17" /></>,
  arrow: <path d="m9 5 7 7-7 7" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  shield: <><path d="m12 3 8 4v5c0 5-8 9-8 9s-8-4-8-9V7l8-4Z" /><path d="m8 12 3 3 5-6" /></>,
  rejected: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6m-6 0 6-6" /></>,
};

export default function DashboardIcon({ name, className = "h-5 w-5" }: { name: DashboardIconName; className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{paths[name]}</svg>;
}
