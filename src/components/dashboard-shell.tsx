"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DashboardNavItem } from "@/lib/dashboard-nav.shared";
import { getDashboardPageTitle } from "@/lib/dashboard-nav.shared";
import {
  ADMIN_MENU_ACTIVE_BG,
  ADMIN_MENU_ACTIVE_RADIUS_CLASS,
  ADMIN_MENU_ACTIVE_TEXT,
  ADMIN_MENU_BG,
  ADMIN_MENU_TEXT,
} from "@/lib/ui.shared";
import { BrandLogo } from "@/components/brand-logo";
import { DashboardNavIconMark } from "@/components/dashboard-nav-icon";
import { StaffAccountMenu } from "@/components/staff-account-menu";

export function DashboardShell(props: {
  staffName: string;
  staffEmail: string;
  roleLabel: string;
  navItems: DashboardNavItem[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const pageTitle = getDashboardPageTitle(pathname, props.navItems);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  function isActive(item: DashboardNavItem): boolean {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  const nav = (
    <nav className="flex flex-col gap-0.5 p-3" aria-label="Разделы">
      {props.navItems.map((item) => {
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className={`flex items-center gap-2.5 px-3 py-2 text-sm transition ${
              active
                ? `${ADMIN_MENU_ACTIVE_RADIUS_CLASS} font-medium`
                : "rounded-xl hover:bg-white/5"
            }`}
            style={{
              backgroundColor: active ? ADMIN_MENU_ACTIVE_BG : undefined,
              color: active ? ADMIN_MENU_ACTIVE_TEXT : ADMIN_MENU_TEXT,
            }}
          >
            <span
              className="shrink-0 opacity-60"
              style={{
                color: active ? ADMIN_MENU_ACTIVE_TEXT : ADMIN_MENU_TEXT,
              }}
            >
              <DashboardNavIconMark icon={item.icon} />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const logo = (
    <div className="flex justify-center px-4 py-5">
      <BrandLogo variant="menu" />
    </div>
  );

  return (
    <div className="min-h-screen min-w-0 bg-zinc-100 lg:flex lg:h-screen lg:overflow-hidden">
      <aside
        className="hidden h-full w-60 shrink-0 flex-col border-r border-white/10 lg:flex"
        style={{ backgroundColor: ADMIN_MENU_BG }}
      >
        {logo}
        <div className="min-h-0 flex-1 overflow-y-auto">{nav}</div>
      </aside>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-zinc-900/40"
            aria-label="Закрыть меню"
            onClick={() => setMenuOpen(false)}
          />
          <aside
            className="absolute inset-y-0 left-0 flex w-[min(100%,18rem)] flex-col shadow-xl"
            style={{ backgroundColor: ADMIN_MENU_BG }}
          >
            <div className="relative border-b border-white/10">
              {logo}
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="absolute right-3 top-3 rounded-lg border border-white/25 px-2.5 py-1.5 text-sm text-white"
              >
                Закрыть
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{nav}</div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 text-zinc-800 lg:hidden"
            aria-label="Открыть меню"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <span className="flex flex-col gap-1" aria-hidden>
              <span className="block h-0.5 w-4 rounded bg-zinc-800" />
              <span className="block h-0.5 w-4 rounded bg-zinc-800" />
              <span className="block h-0.5 w-4 rounded bg-zinc-800" />
            </span>
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold tracking-tight text-zinc-900">
              {pageTitle}
            </p>
          </div>
          <StaffAccountMenu
            staffName={props.staffName}
            staffEmail={props.staffEmail}
            roleLabel={props.roleLabel}
          />
        </header>

        <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10">
          <div className="mx-auto w-full min-w-0 max-w-6xl">{props.children}</div>
        </main>
      </div>
    </div>
  );
}
