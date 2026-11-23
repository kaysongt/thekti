/**
 * The site's one icon set: 24px grid, 1.75 stroke, round caps, currentColor.
 * Decorative by default; pass `label` when the icon carries meaning on its own.
 */

const PATHS = {
  "arrow-right": <path d="M5 12h14M13 6l6 6-6 6" />,
  "chevron-right": <path d="M9 6l6 6-6 6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  "check-circle": <><circle cx="12" cy="12" r="9" /><path d="M8 12.3l2.7 2.7L16 9.5" /></>,
  alert: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5v.01" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V8a4 4 0 018 0v2.5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.2 2" /></>,
  calendar: <><rect x="4" y="5.5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3.5v4M15 3.5v4" /></>,
  play: <><circle cx="12" cy="12" r="9" /><path d="M10 8.8v6.4l5.2-3.2z" /></>,
  book: <path d="M5 4.5h9.5a3 3 0 013 3V20H8a3 3 0 01-3-3zM5 17a3 3 0 013-3h9.5" />,
  download: <path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14" />,
  card: <><rect x="3.5" y="6" width="17" height="12" rx="2" /><path d="M3.5 10h17M7 14.5h3" /></>,
  message: <path d="M5 5.5h14a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5H10l-4.5 3.5V17.5H5A1.5 1.5 0 013.5 16V7A1.5 1.5 0 015 5.5z" />,
  pen: <path d="M14.5 5.5l4 4L9 19H5v-4zM12.5 7.5l4 4" />,
  user: <><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20a7 7 0 0114 0" /></>,
  list: <path d="M9 7h11M9 12h11M9 17h11M4.5 7h.01M4.5 12h.01M4.5 17h.01" />,
  external: <path d="M14 4.5h5.5V10M19.5 4.5L11 13M17 14v4.5a1.5 1.5 0 01-1.5 1.5h-10A1.5 1.5 0 014 18.5v-10A1.5 1.5 0 015.5 7H10" />,
} as const;

export type IconName = keyof typeof PATHS;

export default function Icon({ name, label, className }: { name: IconName; label?: string; className?: string }) {
  return (
    <svg
      className={className ? `icon ${className}` : "icon"}
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
