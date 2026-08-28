import { redirect } from "next/navigation";
import Link from "next/link";
import { getStaffSession } from "@/lib/staff-session.server";
import { canAccessSupport, canAccessWarehouse, canManageCatalog, canManageStaff } from "@/lib/roles.shared";
import { LogoutButton } from "./logout-button";

export default async function DashboardPage() {
  const session = await getStaffSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Панель</h1>
          <p className="mt-1 text-sm text-zinc-600">
            {session.name} · {session.email} · роль {session.role}
          </p>
        </div>
        <LogoutButton />
      </header>
      {canManageCatalog(session.role) ? (
        <Link href="/dashboard/products" className="text-sm underline">
          Ассортимент
        </Link>
      ) : null}
      {canAccessWarehouse(session.role) ? (
        <Link href="/dashboard/orders" className="text-sm underline">
          Заказы
        </Link>
      ) : null}
      {canManageStaff(session.role) ? (
        <Link href="/dashboard/staff" className="text-sm underline">
          Сотрудники
        </Link>
      ) : null}
      {canAccessSupport(session.role) ? (
        <Link href="/dashboard/support" className="text-sm underline">
          Поддержка
        </Link>
      ) : null}
      <p className="text-sm text-zinc-700">
        Аналитика и учёт появятся на следующих шагах.
      </p>
    </main>
  );
}
