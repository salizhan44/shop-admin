"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ApiErrorBody } from "@/lib/auth.shared";
import { PasswordInput } from "@/components/password-input";
import {
  ADMIN_MENU_BG,
  UI_INPUT_CLASS,
  UI_LABEL_CLASS,
  UI_THEME_BUTTON_CLASS,
} from "@/lib/ui.shared";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      const response = await fetch("/api/auth/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as ApiErrorBody | { ok: true };

      if (!response.ok) {
        setError("error" in data ? data.error : "Не удалось войти");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Нет связи с сервером");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-4">
      <label className={UI_LABEL_CLASS}>
        Email
        <input
          type="email"
          autoComplete="username"
          required
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
          autoComplete="current-password"
          required
        />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className={`mt-1 ${UI_THEME_BUTTON_CLASS}`}
        style={{ backgroundColor: ADMIN_MENU_BG }}
      >
        {pending ? "Входим…" : "Войти"}
      </button>
    </form>
  );
}
