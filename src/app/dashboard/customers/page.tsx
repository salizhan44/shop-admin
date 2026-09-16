import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import { canAccessSupport } from "@/lib/roles.shared";
import { listCustomersForStaff } from "@/lib/customers.server";
import { AccessDenied } from "@/components/access-denied";
import { CustomersDirectory } from "./customers-directory";

export default async function CustomersPage() {
  const session = await getStaffSession();
  if (!session) {
    redirect("/login");
  }
  if (!canAccessSupport(session.role)) {
    return (
      <AccessDenied
        title="Клиенты"
        message="Сброс пароля клиента доступен владельцу и поддержке."
      />
    );
  }

  const customers = await listCustomersForStaff();
  return <CustomersDirectory customers={customers} />;
}
