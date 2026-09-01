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
    <div className="flex gap-2">
      <input
        type={visible ? "text" : "password"}
        autoComplete={props.autoComplete}
        required={props.required}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-3 py-2"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="shrink-0 rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
      >
        {visible ? "Скрыть" : "Показать"}
      </button>
    </div>
  );
}
