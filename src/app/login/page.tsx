import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import { LoginForm } from "./login-form";
import { BrandLogo } from "@/components/brand-logo";
import { ADMIN_MENU_BG, UI_CARD_CLASS } from "@/lib/ui.shared";

export default async function LoginPage() {
  const session = await getStaffSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 py-10"
      style={{ backgroundColor: ADMIN_MENU_BG }}
    >
      <div className="mb-8">
        <BrandLogo variant="menu" />
      </div>
      <div className={`w-full max-w-[360px] ${UI_CARD_CLASS} p-6 sm:p-8`}>
        <h1 className="mb-6 text-xl font-semibold tracking-tight text-zinc-900">
          Вход
        </h1>
        <LoginForm />
      </div>
    </div>
  );
}
