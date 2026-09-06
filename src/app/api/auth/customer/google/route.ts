import { corsPreflight, jsonWithCors } from "@/lib/api-cors.server";
import {
  isGoogleAuthError,
  loginOrRegisterWithGoogleIdToken,
} from "@/lib/customer-google-auth.server";
import type { ApiErrorBody } from "@/lib/auth.shared";

export function OPTIONS() {
  return corsPreflight();
}

function isGoogleBody(value: unknown): value is { idToken: string } {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const body = value as Record<string, unknown>;
  return typeof body.idToken === "string" && body.idToken.trim().length > 0;
}

export async function POST(request: Request) {
  const json: unknown = await request.json().catch(() => null);
  if (!isGoogleBody(json)) {
    return jsonWithCors(
      { error: "Нужен токен Google" } satisfies ApiErrorBody,
      { status: 400 },
    );
  }

  const result = await loginOrRegisterWithGoogleIdToken(json.idToken.trim());
  if (isGoogleAuthError(result)) {
    return jsonWithCors(
      { error: result.error } satisfies ApiErrorBody,
      { status: result.status },
    );
  }

  return jsonWithCors(result);
}
