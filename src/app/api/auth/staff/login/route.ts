import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma.server";
import { verifyPassword } from "@/lib/password.server";
import { createStaffSessionCookie } from "@/lib/staff-session.server";
import type { ApiErrorBody, StaffLoginBody } from "@/lib/auth.shared";

function isStaffLoginBody(value: unknown): value is StaffLoginBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const body = value as Record<string, unknown>;
  return typeof body.email === "string" && typeof body.password === "string";
}

export async function POST(request: NextRequest) {
  const json: unknown = await request.json().catch(() => null);
  if (!isStaffLoginBody(json)) {
    return Response.json(
      { error: "Укажите email и пароль" } satisfies ApiErrorBody,
      { status: 400 },
    );
  }

  const email = json.email.trim().toLowerCase();
  const staff = await prisma.staffUser.findUnique({ where: { email } });
  if (!staff) {
    return Response.json(
      { error: "Неверный email или пароль" } satisfies ApiErrorBody,
      { status: 401 },
    );
  }

  const matches = await verifyPassword(json.password, staff.passwordHash);
  if (!matches) {
    return Response.json(
      { error: "Неверный email или пароль" } satisfies ApiErrorBody,
      { status: 401 },
    );
  }

  await createStaffSessionCookie({ staffId: staff.id, role: staff.role });

  return Response.json({
    ok: true,
    name: staff.name,
    role: staff.role,
  });
}
