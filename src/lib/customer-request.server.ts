import { verifyCustomerAccessToken } from "./auth.server";

export async function getCustomerIdFromRequest(
  request: Request,
): Promise<string | null> {
  const header = request.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }
  try {
    const payload = await verifyCustomerAccessToken(header.slice(7).trim());
    return payload.sub;
  } catch {
    return null;
  }
}
