import { corsPreflight, jsonWithCors } from "@/lib/api-cors.server";
import { prisma } from "@/lib/prisma.server";
import { verifyPassword } from "@/lib/password.server";
import {
  issueCustomerAuth,
  toCustomerPublic,
} from "@/lib/customer-auth.server";
import type { ApiErrorBody, CustomerLoginBody } from "@/lib/auth.shared";

export function OPTIONS() {
  return corsPreflight();
}

function isLoginBody(value: unknown): value is CustomerLoginBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const body = value as Record<string, unknown>;
  return typeof body.email === "string" && typeof body.password === "string";
}

export async function POST(request: Request) {
  const json: unknown = await request.json().catch(() => null);
  if (!isLoginBody(json)) {
    return jsonWithCors(
      { error: "Укажите email и пароль" } satisfies ApiErrorBody,
      { status: 400 },
    );
  }

  const email = json.email.trim().toLowerCase();
  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer) {
    return jsonWithCors(
      { error: "Неверный email или пароль" } satisfies ApiErrorBody,
      { status: 401 },
    );
  }

  if (!customer.passwordHash) {
    return jsonWithCors(
      { error: "Этот аккаунт входит через Google" } satisfies ApiErrorBody,
      { status: 401 },
    );
  }

  const matches = await verifyPassword(json.password, customer.passwordHash);
  if (!matches) {
    return jsonWithCors(
      { error: "Неверный email или пароль" } satisfies ApiErrorBody,
      { status: 401 },
    );
  }

  const auth = await issueCustomerAuth(toCustomerPublic(customer));
  return jsonWithCors(auth);
}
