import { corsPreflight, jsonWithCors } from "@/lib/api-cors.server";
import { prisma } from "@/lib/prisma.server";
import {
  hashRefreshToken,
  issueCustomerAuth,
  toCustomerPublic,
} from "@/lib/customer-auth.server";
import type { ApiErrorBody } from "@/lib/auth.shared";

export function OPTIONS() {
  return corsPreflight();
}

export async function POST(request: Request) {
  const json: unknown = await request.json().catch(() => null);
  if (
    typeof json !== "object" ||
    json === null ||
    typeof (json as { refreshToken?: unknown }).refreshToken !== "string"
  ) {
    return jsonWithCors(
      { error: "Нужен refreshToken" } satisfies ApiErrorBody,
      { status: 400 },
    );
  }

  const refreshToken = (json as { refreshToken: string }).refreshToken;
  const tokenHash = hashRefreshToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { customer: true },
  });

  if (!stored || stored.expiresAt < new Date()) {
    if (stored) {
      await prisma.refreshToken.delete({ where: { id: stored.id } });
    }
    return jsonWithCors(
      { error: "Сессия истекла, войдите снова" } satisfies ApiErrorBody,
      { status: 401 },
    );
  }

  const auth = await issueCustomerAuth(toCustomerPublic(stored.customer));
  await prisma.refreshToken.delete({ where: { id: stored.id } });
  return jsonWithCors(auth);
}
