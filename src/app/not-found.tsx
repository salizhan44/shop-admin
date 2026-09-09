export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
      <div className="text-center">
        <p className="text-[clamp(7rem,32vw,18rem)] font-semibold leading-none tracking-tight text-zinc-400">
          404
        </p>
        <p className="mt-3 text-xl font-medium tracking-wide text-zinc-400 sm:text-2xl">
          ошибка
        </p>
      </div>
    </main>
  );
}
