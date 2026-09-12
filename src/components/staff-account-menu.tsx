"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LogoutButton } from "@/components/logout-button";
import { UI_CARD_CLASS } from "@/lib/ui.shared";
import {
  STAFF_PRESENCE_OPTIONS,
  parseStaffPresenceStatus,
  staffInitials,
  staffPresenceStorageKey,
  type StaffPresenceStatus,
} from "@/lib/staff-presence.shared";

function presenceDotClass(status: StaffPresenceStatus): string {
  switch (status) {
    case "online":
      return "bg-emerald-500";
    case "offline":
      return "bg-zinc-400";
    case "lunch":
      return "bg-amber-500";
  }
}

function AvatarMark(props: { name: string; size: "sm" | "lg" }) {
  const sizeClass = props.size === "lg" ? "h-12 w-12 text-base" : "h-9 w-9 text-sm";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[#061e3a] font-semibold text-[#d7b168] ${sizeClass}`}
      aria-hidden
    >
      {staffInitials(props.name)}
    </span>
  );
}

export function StaffAccountMenu(props: {
  staffName: string;
  staffEmail: string;
  roleLabel: string;
}) {
  const buttonId = useId();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [presence, setPresence] = useState<StaffPresenceStatus>("online");

  useEffect(() => {
    const stored = window.localStorage.getItem(
      staffPresenceStorageKey(props.staffEmail),
    );
    setPresence(parseStaffPresenceStatus(stored));
  }, [props.staffEmail]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function onPresenceChange(next: StaffPresenceStatus) {
    setPresence(next);
    window.localStorage.setItem(
      staffPresenceStorageKey(props.staffEmail),
      next,
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        id={buttonId}
        type="button"
        aria-label="Профиль"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        className="rounded-full outline-none ring-offset-2 transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-zinc-400/50"
      >
        <AvatarMark name={props.staffName} size="sm" />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-labelledby={buttonId}
          className={`absolute right-0 z-50 mt-2 w-72 p-4 ${UI_CARD_CLASS}`}
        >
          <div className="flex items-center gap-3">
            <AvatarMark name={props.staffName} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900">
                {props.staffName}
              </p>
              <p className="truncate text-sm text-zinc-500">{props.roleLabel}</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Статус
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {STAFF_PRESENCE_OPTIONS.map((option) => {
                const active = option.value === presence;
                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={active}
                      onClick={() => onPresenceChange(option.value)}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition ${
                        active
                          ? "bg-zinc-100 font-medium text-zinc-900"
                          : "text-zinc-700 hover:bg-zinc-50"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${presenceDotClass(option.value)}`}
                        aria-hidden
                      />
                      {option.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-3 border-t border-zinc-200/80 pt-3">
            <LogoutButton className="flex w-full justify-start rounded-xl px-2.5 py-2 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
