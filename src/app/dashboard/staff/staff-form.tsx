"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ApiErrorBody } from "@/lib/auth.shared";
import {
  ASSIGNABLE_STAFF_ROLES,
  isAssignableStaffRole,
  staffRoleLabel,
  type AssignableStaffRole,
} from "@/lib/roles.shared";
import {
  isStaffRoleEditable,
  type StaffPublic,
} from "@/lib/staff.shared";
import { PasswordInput } from "@/components/password-input";
import { SelectField } from "@/components/select-field";
import { ModalDialog } from "@/components/modal-dialog";
import {
  UI_INPUT_CLASS,
  UI_LABEL_CLASS,
  UI_PRIMARY_BUTTON_CLASS,
} from "@/lib/ui.shared";

export function StaffForm(props: {
  open: boolean;
  member: StaffPublic | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const editing = props.member;
  const roleLocked = editing ? !isStaffRoleEditable(editing.role) : false;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AssignableStaffRole>("WAREHOUSE");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!props.open) {
      return;
    }
    setError("");
    setPassword("");
    if (editing) {
      setName(editing.name);
      setEmail(editing.email);
      if (isAssignableStaffRole(editing.role)) {
        setRole(editing.role);
      }
      return;
    }
    setName("");
    setEmail("");
    setRole("WAREHOUSE");
  }, [props.open, editing]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      const response = editing
        ? await fetch(`/api/staff/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              email,
              role: editing.role === "OWNER" ? "OWNER" : role,
              ...(password ? { password } : {}),
            }),
          })
        : await fetch("/api/staff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password, role }),
          });
      const data = (await response.json()) as ApiErrorBody | { staff: unknown };

      if (!response.ok) {
        setError(
          "error" in data
            ? data.error
            : editing
              ? "Не удалось сохранить сотрудника"
              : "Не удалось добавить сотрудника",
        );
        return;
      }

      props.onClose();
      router.refresh();
    } catch {
      setError("Нет связи с сервером");
    } finally {
      setPending(false);
    }
  }

  return (
    <ModalDialog
      open={props.open}
      title={editing ? "Редактировать сотрудника" : "Добавить сотрудника"}
      onClose={props.onClose}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
          {editing ? "Новый пароль" : "Пароль"}
          <PasswordInput
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            required={!editing}
          />
        </label>
        {roleLocked ? (
          <p className="text-sm text-zinc-600">{staffRoleLabel("OWNER")}</p>
        ) : (
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
        )}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className={UI_PRIMARY_BUTTON_CLASS}
        >
          {pending ? "Сохраняем…" : editing ? "Сохранить" : "Добавить"}
        </button>
      </form>
    </ModalDialog>
  );
}
