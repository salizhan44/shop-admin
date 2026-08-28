import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import { canManageStaff, staffRoleLabel, type StaffRole } from "@/lib/roles.shared";
import { listStaffUsers } from "@/lib/staff.server";
import { StaffForm } from "./staff-form";

function roleAccessHint(role: StaffRole): string {
  switch (role) {
    case "OWNER":
      return "Полный доступ";
    case "WAREHOUSE":
      return "Заказы, без аналитики и учёта";
    case "ACCOUNTANT":
      return "Учёт (позже), без аналитики владельца";
    case "SUPPORT":
      return "Обращения клиентов";
    default:
      return "";
  }
}

export default async function StaffPage() {
  const session = await getStaffSession();
  if (!session) {
    redirect("/login");
  }
  if (!canManageStaff(session.role)) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-4 py-10">
        <a href="/dashboard" className="text-sm text-zinc-600 underline">
          Назад к панели
        </a>
        <h1 className="text-2xl font-semibold">Сотрудники</h1>
        <p className="text-sm text-zinc-700">
          Управление ролями доступно только владельцу.
        </p>
      </main>
    );
  }

  const staff = await listStaffUsers();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <a href="/dashboard" className="text-sm text-zinc-600 underline">
          Назад к панели
        </a>
        <h1 className="text-2xl font-semibold">Сотрудники</h1>
        <p className="text-sm text-zinc-600">
          Добавление кладовщика, бухгалтера и поддержки. Владельца создаёт
          только seed при первом запуске.
        </p>
      </header>

      <StaffForm />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Список</h2>
        {staff.length === 0 ? (
          <p className="text-sm text-zinc-600">Пока только владелец.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {staff.map((member) => (
              <li
                key={member.id}
                className="rounded border border-zinc-200 bg-white px-3 py-2"
              >
                <p className="font-medium">{member.name}</p>
                <p className="text-sm text-zinc-600">{member.email}</p>
                <p className="text-sm text-zinc-700">
                  {staffRoleLabel(member.role)} · {roleAccessHint(member.role)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
