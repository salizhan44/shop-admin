import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import { canManageStaff, staffRoleLabel } from "@/lib/roles.shared";
import { listStaffUsers } from "@/lib/staff.server";
import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/access-denied";
import { StaffForm } from "./staff-form";
import { UI_CARD_CLASS, UI_MUTED_CLASS } from "@/lib/ui.shared";

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
      <PageHeader title="Сотрудники" />
      <StaffForm />
      {staff.length === 0 ? (
        <p className={UI_MUTED_CLASS}>Нет сотрудников</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {staff.map((member) => (
            <li key={member.id} className={`${UI_CARD_CLASS} px-5 py-4`}>
              <p className="font-medium text-zinc-900">{member.name}</p>
              <p className="mt-0.5 text-sm text-zinc-600">{member.email}</p>
              <p className={`${UI_MUTED_CLASS} mt-1`}>
                {staffRoleLabel(member.role)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
