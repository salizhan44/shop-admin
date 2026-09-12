import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import { canAccessSupport } from "@/lib/roles.shared";
import { listSupportTicketsForStaff } from "@/lib/support.server";
import { getLatestSupportTicketUpdatedAt } from "@/lib/updates.server";
import { AccessDenied } from "@/components/access-denied";
import { SupportTicketsBoard } from "./support-tickets-board";

export default async function SupportPage() {
  const session = await getStaffSession();
  if (!session) {
    redirect("/login");
  }
  if (!canAccessSupport(session.role)) {
    return (
      <AccessDenied
        title="Поддержка"
        message="У вашей роли нет доступа к обращениям клиентов."
      />
    );
  }

  const tickets = await listSupportTicketsForStaff();
  const latestAt = await getLatestSupportTicketUpdatedAt();

  return <SupportTicketsBoard tickets={tickets} latestAt={latestAt} />;
}
