import { useRef } from "react";
import {
  ADMIN_MENU_BG,
  UI_LABEL_CLASS,
  UI_THEME_BUTTON_CLASS,
} from "@/lib/ui.shared";

export function ProductImageField(props: {
  imageUrl: string;
  onPick: (file: File | null) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={UI_LABEL_CLASS}>
      Фото
      {props.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={props.imageUrl}
          alt=""
          className="h-36 w-36 rounded-xl object-cover ring-1 ring-zinc-200/80"
        />
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          props.onPick(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`self-start ${UI_THEME_BUTTON_CLASS}`}
        style={{ backgroundColor: ADMIN_MENU_BG }}
      >
        {props.imageUrl ? "Заменить фото" : "Добавить фото"}
      </button>
      {props.imageUrl ? (
        <button
          type="button"
          onClick={props.onClear}
          className="self-start text-sm text-zinc-500 underline"
        >
          Убрать
        </button>
      ) : null}
    </div>
  );
}
