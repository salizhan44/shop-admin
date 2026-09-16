import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "./prisma.server";
import {
  STAFF_COOKIE_NAME,
  STAFF_TOKEN_MAX_AGE_SEC,
  signStaffToken,
  verifyStaffToken,
} from "./auth.server";
import type { StaffRole } from "./roles.shared";
import type { StaffSessionPublic } from "./auth.shared";

export async function createStaffSessionCookie(input: {
  staffId: string;
  role: StaffRole;
}): Promise<void> {
  const token = await signStaffToken(input);
  const jar = await cookies();
  jar.set(STAFF_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: STAFF_TOKEN_MAX_AGE_SEC,
  });
}

export async function clearStaffSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(STAFF_COOKIE_NAME);
}

export const getStaffSession = cache(
  async (): Promise<StaffSessionPublic | null> => {
    const jar = await cookies();
    const token = jar.get(STAFF_COOKIE_NAME)?.value;
    if (!token) {
      return null;
    }

    try {
      const payload = await verifyStaffToken(token);
      const staff = await prisma.staffUser.findUnique({
        where: { id: payload.sub },
        select: { name: true, email: true, role: true },
      });
      if (!staff) {
        return null;
      }
      return staff;
    } catch {
      return null;
    }
  },
);
