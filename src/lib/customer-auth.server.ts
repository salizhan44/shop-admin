import { createHash, randomBytes } from "node:crypto";
import { prisma } from "./prisma.server";
import { signCustomerAccessToken } from "./auth.server";
import {
  customerHasPassword,
  type CustomerAuthSuccess,
  type CustomerPublic,
} from "./auth.shared";

const REFRESH_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createRefreshTokenValue(): string {
  return randomBytes(32).toString("hex");
}

export async function issueCustomerAuth(
  customer: CustomerPublic,
): Promise<CustomerAuthSuccess> {
  const accessToken = await signCustomerAccessToken(customer.id);
  const refreshToken = createRefreshTokenValue();

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashRefreshToken(refreshToken),
      customerId: customer.id,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    },
  });

  return { accessToken, refreshToken, customer };
}

export function toCustomerPublic(customer: {
  id: string;
  email: string;
  name: string;
  homeAddress: string;
  avatarUrl: string;
  passwordHash: string | null;
  loyaltyPoints: number;
}): CustomerPublic {
  return {
    id: customer.id,
    email: customer.email,
    name: customer.name,
    homeAddress: customer.homeAddress,
    avatarUrl: customer.avatarUrl,
    hasPassword: customerHasPassword(customer.passwordHash),
    loyaltyPoints: Math.max(0, customer.loyaltyPoints),
  };
}
