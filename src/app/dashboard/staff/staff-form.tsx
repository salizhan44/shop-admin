"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ApiErrorBody } from "@/lib/auth.shared";
import {
  ASSIGNABLE_STAFF_ROLES,
  staffRoleLabel,
  type AssignableStaffRole,
} from "@/lib/roles.shared";
import { PasswordInput } from "@/components/password-input";

export function StaffForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AssignableStaffRole>("WAREHOUSE");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = (await response.json()) as ApiErrorBody | { staff: unknown };

      if (!response.ok) {
        setError(
          "error" in data ? data.error : "Не удалось добавить сотрудника",
        );
        return;
      }

      setName("");
      setEmail("");
      setPassword("");
      setRole("WAREHOUSE");
      router.refresh();
    } catch {
      setError("Нет связи с сервером");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Имя
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded border border-zinc-300 bg-white px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Email для входа
        <input
          required
          type="email"
          autoComplete="off"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded border border-zinc-300 bg-white px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Пароль
        <PasswordInput
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Роль
        <select
          value={role}
          onChange={(event) =>
            setRole(event.target.value as AssignableStaffRole)
          }
          className="rounded border border-zinc-300 bg-white px-3 py-2"
        >
          {ASSIGNABLE_STAFF_ROLES.map((item) => (
            <option key={item} value={item}>
              {staffRoleLabel(item)}
            </option>
          ))}
        </select>
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-60"
      >
        {pending ? "Сохраняем…" : "Добавить сотрудника"}
      </button>
    </form>
  );
}
