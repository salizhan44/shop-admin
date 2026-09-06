import { prisma } from "./prisma.server";
import {
  issueCustomerAuth,
  toCustomerPublic,
} from "./customer-auth.server";
import { verifyGoogleIdToken } from "./google-auth.server";
import type { CustomerAuthSuccess } from "./auth.shared";

export async function loginOrRegisterWithGoogleIdToken(
  idToken: string,
): Promise<CustomerAuthSuccess | { error: string; status: number }> {
  const verified = await verifyGoogleIdToken(idToken);
  if ("error" in verified) {
    return { error: verified.error, status: 401 };
  }

  const byGoogle = await prisma.customer.findUnique({
    where: { googleId: verified.sub },
  });
  if (byGoogle) {
    return issueCustomerAuth(toCustomerPublic(byGoogle));
  }

  const byEmail = await prisma.customer.findUnique({
    where: { email: verified.email },
  });
  if (byEmail) {
    const linked = await prisma.customer.update({
      where: { id: byEmail.id },
      data: {
        googleId: verified.sub,
        ...(byEmail.avatarUrl.trim().length === 0 && verified.picture
          ? { avatarUrl: verified.picture }
          : {}),
      },
    });
    return issueCustomerAuth(toCustomerPublic(linked));
  }

  const created = await prisma.customer.create({
    data: {
      email: verified.email,
      name: verified.name,
      googleId: verified.sub,
      passwordHash: null,
      avatarUrl: verified.picture,
    },
  });
  return issueCustomerAuth(toCustomerPublic(created));
}

export function isGoogleAuthError(
  value: CustomerAuthSuccess | { error: string; status: number },
): value is { error: string; status: number } {
  return "error" in value;
}
