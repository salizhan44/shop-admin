"use client";

import { useState } from "react";

export function PasswordInput(props: {
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex w-full gap-2">
      <input
        type={visible ? "text" : "password"}
        autoComplete={props.autoComplete}
        required={props.required}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 outline-none focus:border-zinc-500"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="shrink-0 rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50"
      >
        {visible ? "Скрыть" : "Показать"}
      </button>
    </div>
  );
}
