import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import { canManageStaff, staffRoleLabel, type StaffRole } from "@/lib/roles.shared";
import { listStaffUsers } from "@/lib/staff.server";
import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/access-denied";
import { StaffForm } from "./staff-form";

function roleAccessHint(role: StaffRole): string {
  switch (role) {
    case "OWNER":
      return "Полный доступ";
    case "WAREHOUSE":
      return "Заказы, без аналитики и учёта";
    case "ACCOUNTANT":
      return "Учёт, без аналитики владельца";
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
      <AccessDenied
        title="Сотрудники"
        message="Управление ролями доступно только владельцу."
      />
    );
  }

  const staff = await listStaffUsers();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Сотрудники"
        description="Добавление кладовщика, бухгалтера и поддержки. Владельца создаёт только seed при первом запуске."
      />

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
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3"
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
    </div>
  );
}
