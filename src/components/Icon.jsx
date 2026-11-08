const paths = {
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5" /><path d="M16 4.5a3.5 3.5 0 010 7M18 14.8c2 .7 3.5 2.3 3.5 5.2" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  ticket: <><path d="M4 8a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a2 2 0 000-4z" /><path d="M14 6v12" /></>,
  sliders: <><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></>,
  alert: <><path d="M12 4l9 16H3z" /><path d="M12 10v4M12 17.5v.01" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  chevron: <path d="M6 9l6 6 6-6" />,
}

export default function Icon({ name, size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}
