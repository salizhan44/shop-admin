import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await getStaffSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-10">
      <div className="w-full max-w-[360px] rounded-xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Магазин
          </p>
          <h1 className="mt-1 text-xl font-semibold text-zinc-900">
            Вход для сотрудников
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Клиенты приложения сюда не входят.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
