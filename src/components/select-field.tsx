"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  UI_INPUT_CLASS,
  type SelectOption,
} from "@/lib/ui.shared";

export function SelectField(props: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  const buttonId = useId();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = props.options.find((item) => item.value === props.value);
  const label = selected?.label ?? props.placeholder ?? "Выберите";

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        id={buttonId}
        type="button"
        disabled={props.disabled}
        aria-label={props["aria-label"]}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          if (!props.disabled) {
            setOpen((current) => !current);
          }
        }}
        className={`${UI_INPUT_CLASS} flex items-center justify-between gap-3 text-left ${
          selected ? "" : "text-zinc-400"
        }`}
      >
        <span className="min-w-0 truncate">{label}</span>
        <span
          className={`shrink-0 text-zinc-400 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▾
        </span>
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={buttonId}
          className="absolute z-50 mt-1.5 max-h-60 w-full overflow-y-auto rounded-2xl bg-white py-1 shadow-lg ring-1 ring-zinc-200/80"
        >
          {props.options.map((option) => {
            const active = option.value === props.value;
            return (
              <li key={option.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    props.onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full px-3.5 py-2 text-left text-sm transition ${
                    active
                      ? "bg-zinc-100 font-medium text-zinc-900"
                      : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
