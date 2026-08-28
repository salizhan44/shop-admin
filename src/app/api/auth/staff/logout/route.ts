import { clearStaffSessionCookie } from "@/lib/staff-session.server";

export async function POST() {
  await clearStaffSessionCookie();
  return Response.json({ ok: true });
}
