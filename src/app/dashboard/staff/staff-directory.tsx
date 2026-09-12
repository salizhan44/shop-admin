"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { staffRoleLabel } from "@/lib/roles.shared";
import { filterStaffBySearch, type StaffPublic } from "@/lib/staff.shared";
import {
  staffDirectoryPresence,
  staffDirectoryPresenceLabel,
  staffInitials,
  staffPresenceStorageKey,
  type StaffDirectoryPresence,
} from "@/lib/staff-presence.shared";
import { ADMIN_MENU_BG, UI_MUTED_CLASS } from "@/lib/ui.shared";
import { StaffForm } from "./staff-form";

const TABLE_INNER_CLASS = "w-max min-w-full";
const ROW_GRID =
  "grid w-full grid-cols-[minmax(min-content,1.4fr)_minmax(min-content,0.8fr)_minmax(min-content,0.8fr)_2.75rem] items-center gap-3 px-5";
const CELL_TEXT = "whitespace-nowrap text-sm";

export function StaffDirectory(props: { staff: StaffPublic[] }) {
  const [searchDraft, setSearchDraft] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StaffPublic | null>(null);
  const [presenceByEmail, setPresenceByEmail] = useState<
    Record<string, StaffDirectoryPresence>
  >({});
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const next: Record<string, StaffDirectoryPresence> = {};
    for (const member of props.staff) {
      const stored = window.localStorage.getItem(
        staffPresenceStorageKey(member.email),
      );
      next[member.email] = staffDirectoryPresence(member.email, stored);
    }
    setPresenceByEmail(next);
  }, [props.staff]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    function onWheel(event: WheelEvent) {
      const node = scrollerRef.current;
      if (!node) {
        return;
      }
      const target = event.target;
      if (target instanceof Element && target.closest('[role="dialog"]')) {
        return;
      }
      if (node.scrollWidth <= node.clientWidth + 1) {
        return;
      }
      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;
      const max = node.scrollWidth - node.clientWidth;
      const next = Math.min(max, Math.max(0, node.scrollLeft + delta));
      if (Math.abs(next - node.scrollLeft) < 1) {
        return;
      }
      event.preventDefault();
      node.scrollLeft = next;
    }

    scroller.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      scroller.removeEventListener("wheel", onWheel);
    };
  }, []);

  const visible = useMemo(
    () => filterStaffBySearch(props.staff, searchApplied),
    [props.staff, searchApplied],
  );

  function presenceOf(email: string): StaffDirectoryPresence {
    return presenceByEmail[email] ?? staffDirectoryPresence(email);
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex items-start gap-3">
        <form
          className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl bg-white px-3.5"
          onSubmit={(event) => {
            event.preventDefault();
            setSearchApplied(searchDraft);
          }}
        >
          <input
            type="search"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Поиск"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-500"
          />
          {searchDraft || searchApplied ? (
            <button
              type="button"
              onClick={() => {
                setSearchDraft("");
                setSearchApplied("");
              }}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-300/70 text-xs font-semibold text-zinc-600"
              aria-label="Очистить"
            >
              ✕
            </button>
          ) : null}
          <button
            type="submit"
            className="shrink-0 text-xl leading-none text-zinc-500"
            aria-label="Найти"
          >
            ⌕
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="inline-flex h-10 shrink-0 items-center rounded-xl px-4 text-sm font-medium text-white transition hover:opacity-90"
          style={{ backgroundColor: ADMIN_MENU_BG }}
        >
          Добавить
        </button>
      </div>

      <div
        ref={scrollerRef}
        className="min-w-0 overflow-x-hidden rounded-2xl bg-zinc-100 shadow-[0_10px_28px_rgba(6,30,58,0.10)] ring-1 ring-zinc-200/70"
      >
        <div className={TABLE_INNER_CLASS}>
          <div className={`${ROW_GRID} bg-zinc-100 py-2.5 text-sm text-zinc-500`}>
            <span className="whitespace-nowrap">Имя</span>
            <span className="whitespace-nowrap">Роль</span>
            <span className="whitespace-nowrap">Статус</span>
            <span>
              <span className="sr-only">Редактирование</span>
            </span>
          </div>
          {visible.length === 0 ? (
            <div className="bg-white px-5 py-8">
              <p className={UI_MUTED_CLASS}>Нет сотрудников</p>
            </div>
          ) : (
            <ul className="w-full bg-white">
              {visible.map((member) => {
                const presence = presenceOf(member.email);
                return (
                  <li
                    key={member.id}
                    className={`${ROW_GRID} border-t border-zinc-100 py-3`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#061e3a] text-sm font-semibold text-[#d7b168]"
                        aria-hidden
                      >
                        {staffInitials(member.name)}
                      </span>
                      <p className={`${CELL_TEXT} font-medium text-zinc-900`}>
                        {member.name}
                      </p>
                    </div>
                    <p className={`${CELL_TEXT} text-zinc-700`}>
                      {staffRoleLabel(member.role)}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-zinc-700">
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                          presence === "online" ? "bg-emerald-500" : "bg-red-500"
                        }`}
                        aria-hidden
                      />
                      <span className="whitespace-nowrap">
                        {staffDirectoryPresenceLabel(presence)}
                      </span>
                    </div>
                    <button
                      type="button"
                      aria-label="Редактировать"
                      onClick={() => {
                        setEditing(member);
                        setFormOpen(true);
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-800"
                    >
                      <PencilIcon />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <StaffForm
        open={formOpen}
        member={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      />
    </div>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d="M12.5 3.5 16.5 7.5 7 17H3v-4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
