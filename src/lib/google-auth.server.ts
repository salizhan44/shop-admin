import { createRemoteJWKSet, jwtVerify } from "jose";

const googleJwks = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

function googleAudiences(): string[] {
  const raw =
    process.env.GOOGLE_CLIENT_IDS?.trim() ||
    process.env.GOOGLE_WEB_CLIENT_ID?.trim() ||
    "";
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export type GoogleIdTokenPayload = {
  sub: string;
  email: string;
  name: string;
  picture: string;
  emailVerified: boolean;
};

export async function verifyGoogleIdToken(
  idToken: string,
): Promise<GoogleIdTokenPayload | { error: string }> {
  const audiences = googleAudiences();
  if (audiences.length === 0) {
    return { error: "Вход через Google не настроен на сервере" };
  }

  try {
    const { payload } = await jwtVerify(idToken, googleJwks, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: audiences,
    });

    const email =
      typeof payload.email === "string"
        ? payload.email.trim().toLowerCase()
        : "";
    const sub = typeof payload.sub === "string" ? payload.sub : "";
    if (!email || !sub) {
      return { error: "В аккаунте Google нет email" };
    }
    if (payload.email_verified !== true) {
      return { error: "Подтвердите email в аккаунте Google" };
    }

    const name =
      typeof payload.name === "string" && payload.name.trim().length > 0
        ? payload.name.trim()
        : email.split("@")[0] || "Клиент";
    const picture =
      typeof payload.picture === "string" ? payload.picture.trim() : "";

    return {
      sub,
      email,
      name,
      picture,
      emailVerified: true,
    };
  } catch {
    return { error: "Не удалось проверить аккаунт Google" };
  }
}
