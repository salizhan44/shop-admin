import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import { LoginForm } from "./login-form";
import { BrandLogo } from "@/components/brand-logo";
import { UI_CARD_CLASS } from "@/lib/ui.shared";

export default async function LoginPage() {
  const session = await getStaffSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-10">
      <div className={`w-full max-w-[360px] ${UI_CARD_CLASS} p-6 sm:p-8`}>
        <div className="mb-6">
          <BrandLogo className="h-12 w-auto max-w-full" />
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-zinc-900">
            Вход
          </h1>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
