"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ApiErrorBody } from "@/lib/auth.shared";
import {
  filterCustomersBySearch,
  type CustomerStaffPublic,
} from "@/lib/customers.shared";
import { PasswordInput } from "@/components/password-input";
import { ModalDialog } from "@/components/modal-dialog";
import {
  UI_LABEL_CLASS,
  UI_MUTED_CLASS,
  UI_PRIMARY_BUTTON_CLASS,
  UI_SECONDARY_BUTTON_CLASS,
} from "@/lib/ui.shared";

export function CustomersDirectory(props: {
  customers: CustomerStaffPublic[];
}) {
  const router = useRouter();
  const [searchDraft, setSearchDraft] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [selected, setSelected] = useState<CustomerStaffPublic | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  const visible = useMemo(
    () => filterCustomersBySearch(props.customers, searchApplied),
    [props.customers, searchApplied],
  );

  function closeModal() {
    setSelected(null);
    setPassword("");
    setConfirm("");
    setError("");
    setSaved(false);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selected) {
      return;
    }
    setError("");
    setSaved(false);
    if (password !== confirm) {
      setError("Пароли не совпадают");
      return;
    }
    setPending(true);
    try {
      const response = await fetch(
        `/api/staff/customers/${selected.id}/password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        },
      );
      const data = (await response.json()) as ApiErrorBody | { ok: true };
      if (!response.ok) {
        setError("error" in data ? data.error : "Не удалось сохранить пароль");
        return;
      }
      setPassword("");
      setConfirm("");
      setSaved(true);
      router.refresh();
    } catch {
      setError("Нет связи с сервером");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <form
        className="flex h-10 min-w-0 items-center gap-2 rounded-xl bg-white px-3.5"
        onSubmit={(event) => {
          event.preventDefault();
          setSearchApplied(searchDraft);
        }}
      >
        <input
          type="text"
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

      {visible.length === 0 ? (
        <p className={UI_MUTED_CLASS}>Клиентов не найдено</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((customer) => (
            <li
              key={customer.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-zinc-200/70"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-900">
                  {customer.name}
                </p>
                <p className={`truncate ${UI_MUTED_CLASS}`}>{customer.email}</p>
              </div>
              <button
                type="button"
                disabled={!customer.hasPassword}
                onClick={() => {
                  setSelected(customer);
                  setPassword("");
                  setConfirm("");
                  setError("");
                  setSaved(false);
                }}
                className={UI_SECONDARY_BUTTON_CLASS}
              >
                Сбросить пароль
              </button>
            </li>
          ))}
        </ul>
      )}

      <ModalDialog
        open={selected !== null}
        title={selected ? `Пароль · ${selected.email}` : "Пароль"}
        onClose={closeModal}
      >
        {selected ? (
          <form className="flex flex-col gap-4" onSubmit={(event) => void onSubmit(event)}>
            <label className={UI_LABEL_CLASS}>
              Новый пароль
              <PasswordInput
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                required
              />
            </label>
            <label className={UI_LABEL_CLASS}>
              Повтор
              <PasswordInput
                value={confirm}
                onChange={setConfirm}
                autoComplete="new-password"
                required
              />
            </label>
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            {saved ? (
              <p className="text-sm text-emerald-700">Пароль сохранён</p>
            ) : null}
            <button
              type="submit"
              disabled={pending}
              className={UI_PRIMARY_BUTTON_CLASS}
            >
              {pending ? "Сохраняем…" : "Сохранить пароль"}
            </button>
          </form>
        ) : null}
      </ModalDialog>
    </div>
  );
}
