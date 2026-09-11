"use client";

import { useState } from "react";
import { UI_INPUT_CLASS, UI_SECONDARY_BUTTON_CLASS } from "@/lib/ui.shared";

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
        className={`min-w-0 flex-1 ${UI_INPUT_CLASS}`}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className={`shrink-0 ${UI_SECONDARY_BUTTON_CLASS}`}
      >
        {visible ? "Скрыть" : "Показать"}
      </button>
    </div>
  );
}
