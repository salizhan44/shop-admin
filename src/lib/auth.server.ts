import { SignJWT, jwtVerify } from "jose";
import type { StaffRole } from "./roles.shared";

const STAFF_TOKEN_MAX_AGE_SEC = 60 * 60 * 8;
const CUSTOMER_ACCESS_MAX_AGE_SEC = 60 * 15;

export const STAFF_COOKIE_NAME = "staff_token";

type StaffTokenPayload = {
  sub: string;
  role: StaffRole;
  typ: "staff";
};

type CustomerTokenPayload = {
  sub: string;
  typ: "customer";
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function signStaffToken(input: {
  staffId: string;
  role: StaffRole;
}): Promise<string> {
  return new SignJWT({ role: input.role, typ: "staff" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.staffId)
    .setIssuedAt()
    .setExpirationTime(`${STAFF_TOKEN_MAX_AGE_SEC}s`)
    .sign(getJwtSecret());
}

export async function verifyStaffToken(
  token: string,
): Promise<StaffTokenPayload> {
  const { payload } = await jwtVerify(token, getJwtSecret());
  if (payload.typ !== "staff" || typeof payload.sub !== "string") {
    throw new Error("Invalid staff token");
  }
  return {
    sub: payload.sub,
    role: payload.role as StaffRole,
    typ: "staff",
  };
}

export async function signCustomerAccessToken(customerId: string): Promise<string> {
  return new SignJWT({ typ: "customer" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(customerId)
    .setIssuedAt()
    .setExpirationTime(`${CUSTOMER_ACCESS_MAX_AGE_SEC}s`)
    .sign(getJwtSecret());
}

export async function verifyCustomerAccessToken(
  token: string,
): Promise<CustomerTokenPayload> {
  const { payload } = await jwtVerify(token, getJwtSecret());
  if (payload.typ !== "customer" || typeof payload.sub !== "string") {
    throw new Error("Invalid customer token");
  }
  return { sub: payload.sub, typ: "customer" };
}

export { STAFF_TOKEN_MAX_AGE_SEC };
