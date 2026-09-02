"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DashboardNavItem } from "@/lib/dashboard-nav.shared";
import { getDashboardPageTitle } from "@/lib/dashboard-nav.shared";
import { LogoutButton } from "@/components/logout-button";

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
            className={
              active
                ? "rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
                : "rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-zinc-100 lg:flex">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-zinc-200 bg-white lg:flex">
        <div className="border-b border-zinc-200 px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Магазин
          </p>
          <p className="mt-0.5 text-sm font-semibold text-zinc-900">Панель</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{nav}</div>
        <div className="border-t border-zinc-200 px-4 py-3">
          <p className="truncate text-sm font-medium text-zinc-900">
            {props.staffName}
          </p>
          <p className="truncate text-xs text-zinc-500">{props.roleLabel}</p>
        </div>
      </aside>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-zinc-900/40"
            aria-label="Закрыть меню"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(100%,18rem)] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Магазин
                </p>
                <p className="text-sm font-semibold text-zinc-900">Меню</p>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm text-zinc-700"
              >
                Закрыть
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{nav}</div>
            <div className="border-t border-zinc-200 px-4 py-3">
              <p className="truncate text-sm font-medium text-zinc-900">
                {props.staffName}
              </p>
              <p className="truncate text-xs text-zinc-500">{props.staffEmail}</p>
              <p className="mt-0.5 truncate text-xs text-zinc-500">
                {props.roleLabel}
              </p>
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
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
            <p className="truncate text-sm font-semibold text-zinc-900 lg:text-base">
              {pageTitle}
            </p>
            <p className="hidden truncate text-xs text-zinc-500 sm:block lg:hidden">
              {props.staffName} · {props.roleLabel}
            </p>
          </div>
          <LogoutButton />
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-5xl">{props.children}</div>
        </main>
      </div>
    </div>
  );
}
