import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";

export default async function HomePage() {
  const session = await getStaffSession();
  redirect(session ? "/dashboard" : "/login");
}
