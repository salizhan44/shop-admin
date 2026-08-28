import { corsPreflight, jsonWithCors } from "@/lib/api-cors.server";
import { prisma } from "@/lib/prisma.server";
import { hashPassword } from "@/lib/password.server";
import {
  issueCustomerAuth,
  toCustomerPublic,
} from "@/lib/customer-auth.server";
import type { ApiErrorBody, CustomerRegisterBody } from "@/lib/auth.shared";

export function OPTIONS() {
  return corsPreflight();
}

function isRegisterBody(value: unknown): value is CustomerRegisterBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const body = value as Record<string, unknown>;
  return (
    typeof body.email === "string" &&
    typeof body.password === "string" &&
    typeof body.name === "string"
  );
}

export async function POST(request: Request) {
  const json: unknown = await request.json().catch(() => null);
  if (!isRegisterBody(json)) {
    return jsonWithCors(
      { error: "Укажите имя, email и пароль" } satisfies ApiErrorBody,
      { status: 400 },
    );
  }

  const email = json.email.trim().toLowerCase();
  const name = json.name.trim();
  const password = json.password;

  if (!email || !name || password.length < 8) {
    return jsonWithCors(
      { error: "Пароль не короче 8 символов, имя и email обязательны" } satisfies ApiErrorBody,
      { status: 400 },
    );
  }

  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing) {
    return jsonWithCors(
      { error: "Этот email уже зарегистрирован" } satisfies ApiErrorBody,
      { status: 409 },
    );
  }

  const customer = await prisma.customer.create({
    data: {
      email,
      name,
      passwordHash: await hashPassword(password),
    },
  });

  const auth = await issueCustomerAuth(toCustomerPublic(customer));
  return jsonWithCors(auth, { status: 201 });
}
