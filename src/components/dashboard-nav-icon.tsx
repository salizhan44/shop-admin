import type { ReactNode } from "react";
import type { DashboardNavIcon } from "@/lib/dashboard-nav.shared";

function IconMark(props: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
      aria-hidden
    >
      {props.children}
    </svg>
  );
}

export function DashboardNavIconMark(props: { icon: DashboardNavIcon }) {
  switch (props.icon) {
    case "overview":
      return (
        <IconMark>
          <rect
            x="2.5"
            y="2.5"
            width="6"
            height="6"
            rx="1"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <rect
            x="11.5"
            y="2.5"
            width="6"
            height="6"
            rx="1"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <rect
            x="2.5"
            y="11.5"
            width="6"
            height="6"
            rx="1"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <rect
            x="11.5"
            y="11.5"
            width="6"
            height="6"
            rx="1"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </IconMark>
      );
    case "orders":
      return (
        <IconMark>
          <path
            d="M5 4.5h10l-.7 9.2a1.5 1.5 0 0 1-1.5 1.4H7.2a1.5 1.5 0 0 1-1.5-1.4L5 4.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M7.5 8.5V7a2.5 2.5 0 0 1 5 0v1.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </IconMark>
      );
    case "stock":
      return (
        <IconMark>
          <path
            d="M3.5 7.2 10 3.8l6.5 3.4v7.2L10 17.8 3.5 14.4V7.2Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M10 8v9.5M3.7 7.3 10 10.6l6.3-3.3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </IconMark>
      );
    case "products":
      return (
        <IconMark>
          <path
            d="M3.8 10.2 10.2 3.8a1.2 1.2 0 0 1 1.7 0l4.3 4.3a1.2 1.2 0 0 1 0 1.7L9.8 16.2a1.2 1.2 0 0 1-1.7 0L3.8 11.9a1.2 1.2 0 0 1 0-1.7Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="12.2" cy="7.8" r="1.15" fill="currentColor" />
        </IconMark>
      );
    case "promo":
      return (
        <IconMark>
          <circle cx="6.5" cy="6.5" r="1.4" fill="currentColor" />
          <circle cx="13.5" cy="13.5" r="1.4" fill="currentColor" />
          <path
            d="M14.5 5.5 5.5 14.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </IconMark>
      );
    case "staff":
      return (
        <IconMark>
          <circle cx="10" cy="7" r="2.4" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M5 16c.6-2.6 2.4-4 5-4s4.4 1.4 5 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </IconMark>
      );
    case "customers":
      return (
        <IconMark>
          <circle cx="8" cy="7.2" r="2.2" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M3.8 15.5c.5-2.3 2-3.5 4.2-3.5s3.7 1.2 4.2 3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M13.2 8.2h3.4M14.9 6.5v3.4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </IconMark>
      );
    case "support":
      return (
        <IconMark>
          <path
            d="M4.5 5.5h11v8h-4.2L8 16.2V13.5H4.5v-8Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </IconMark>
      );
    case "analytics":
      return (
        <IconMark>
          <path
            d="M3.5 15.5h13"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M6 12.5v-3M10 12.5V6.5M14 12.5V8.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </IconMark>
      );
    case "accounting":
      return (
        <IconMark>
          <rect
            x="4"
            y="3.5"
            width="12"
            height="13"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M7 8h6M7 11h6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </IconMark>
      );
  }
}
