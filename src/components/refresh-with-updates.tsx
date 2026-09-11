"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isUpdatesCheckPublic,
  UPDATES_POLL_INTERVAL_MS,
} from "@/lib/updates.shared";

export function RefreshWithUpdates(props: {
  pollUrl: string;
  initialLatestAt: string | null;
}) {
  const router = useRouter();
  const [seenAt, setSeenAt] = useState(
    () => props.initialLatestAt ?? new Date().toISOString(),
  );
  const [hasUpdates, setHasUpdates] = useState(false);

  useEffect(() => {
    setSeenAt(props.initialLatestAt ?? new Date().toISOString());
    setHasUpdates(false);
  }, [props.initialLatestAt]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const params = new URLSearchParams({ since: seenAt });
      const response = await fetch(`${props.pollUrl}?${params.toString()}`);
      if (!response.ok || cancelled) {
        return;
      }
      const data: unknown = await response.json().catch(() => null);
      if (!isUpdatesCheckPublic(data) || cancelled) {
        return;
      }
      if (data.hasUpdates) {
        setHasUpdates(true);
      }
    }

    const interval = setInterval(() => {
      void poll();
    }, UPDATES_POLL_INTERVAL_MS);
    void poll();

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [props.pollUrl, seenAt]);

  function onRefresh() {
    setHasUpdates(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onRefresh}
        aria-label="Обновить"
        title="Обновить"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-zinc-400 ring-1 ring-zinc-200/80 transition hover:bg-zinc-50 hover:text-zinc-700"
      >
        <span className="-mt-1 text-[22px] leading-none" aria-hidden>
          ↻
        </span>
      </button>
      {hasUpdates ? (
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full bg-green-500"
          title="Есть новые данные"
          aria-label="Есть новые данные"
        />
      ) : null}
    </div>
  );
}
