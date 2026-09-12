import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import { canManageStaff } from "@/lib/roles.shared";
import { listStaffUsers } from "@/lib/staff.server";
import { AccessDenied } from "@/components/access-denied";
import { StaffDirectory } from "./staff-directory";

export default async function StaffPage() {
  const session = await getStaffSession();
  if (!session) {
    redirect("/login");
  }
  if (!canManageStaff(session.role)) {
    return (
      <AccessDenied
        title="Сотрудники"
        message="Управление сотрудниками доступно только владельцу."
      />
    );
  }

  const staff = await listStaffUsers();
  return <StaffDirectory staff={staff} />;
}
