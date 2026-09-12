export function CatalogSearchField(props: {
  value: string;
  showClear: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
}) {
  return (
    <form
      className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl bg-white px-3.5"
      onSubmit={(event) => {
        event.preventDefault();
        props.onSubmit();
      }}
    >
      <input
        type="text"
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        placeholder="Поиск"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className="h-full min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-500"
      />
      {props.showClear ? (
        <button
          type="button"
          onClick={props.onClear}
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
  );
}
