import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await getStaffSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-semibold">Вход для сотрудников</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Клиенты приложения сюда не входят.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
