import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import { staffRoleLabel } from "@/lib/roles.shared";
import { getDashboardNavItems } from "@/lib/dashboard-nav.shared";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await getStaffSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardShell
      staffName={session.name}
      staffEmail={session.email}
      roleLabel={staffRoleLabel(session.role)}
      navItems={getDashboardNavItems(session.role)}
    >
      {children}
    </DashboardShell>
  );
}
