export type PushPlatform = "ios" | "android" | "web" | "unknown";

export type RegisterPushTokenBody = {
  token: string;
  platform: PushPlatform;
};

export function isRegisterPushTokenBody(
  value: unknown,
): value is RegisterPushTokenBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const body = value as { token?: unknown; platform?: unknown };
  if (typeof body.token !== "string" || body.token.trim().length < 8) {
    return false;
  }
  if (
    body.platform !== "ios" &&
    body.platform !== "android" &&
    body.platform !== "web" &&
    body.platform !== "unknown"
  ) {
    return false;
  }
  return true;
}

export function isExpoPushToken(token: string): boolean {
  return (
    token.startsWith("ExponentPushToken[") ||
    token.startsWith("ExpoPushToken[")
  );
}
