"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ApiErrorBody } from "@/lib/auth.shared";
import {
  ASSIGNABLE_STAFF_ROLES,
  isAssignableStaffRole,
  staffRoleLabel,
  type AssignableStaffRole,
} from "@/lib/roles.shared";
import { PasswordInput } from "@/components/password-input";
import { SelectField } from "@/components/select-field";
import {
  UI_CARD_CLASS,
  UI_INPUT_CLASS,
  UI_LABEL_CLASS,
  UI_PRIMARY_BUTTON_CLASS,
} from "@/lib/ui.shared";

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
    <form
      onSubmit={onSubmit}
      className={`flex max-w-md flex-col gap-4 ${UI_CARD_CLASS} p-5`}
    >
      <label className={UI_LABEL_CLASS}>
        Имя
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={UI_INPUT_CLASS}
        />
      </label>
      <label className={UI_LABEL_CLASS}>
        Email
        <input
          required
          type="email"
          autoComplete="off"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={UI_INPUT_CLASS}
        />
      </label>
      <label className={UI_LABEL_CLASS}>
        Пароль
        <PasswordInput
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          required
        />
      </label>
      <label className={UI_LABEL_CLASS}>
        Роль
        <SelectField
          value={role}
          onChange={(value) => {
            if (isAssignableStaffRole(value)) {
              setRole(value);
            }
          }}
          options={ASSIGNABLE_STAFF_ROLES.map((item) => ({
            value: item,
            label: staffRoleLabel(item),
          }))}
        />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className={UI_PRIMARY_BUTTON_CLASS}
      >
        {pending ? "Сохраняем…" : "Добавить"}
      </button>
    </form>
  );
}
