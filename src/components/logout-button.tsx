"use client";

import { useRouter } from "next/navigation";

export function LogoutButton(props: { className?: string }) {
  const router = useRouter();

  async function onClick() {
    await fetch("/api/auth/staff/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        props.className ??
        "rounded-xl px-3 py-1.5 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200/80 transition hover:bg-zinc-50"
      }
    >
      Выйти
    </button>
  );
}
