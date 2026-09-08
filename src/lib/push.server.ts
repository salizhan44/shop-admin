import admin from "firebase-admin";
import { prisma } from "./prisma.server";
import { isExpoPushToken, type PushPlatform } from "./push.shared";

type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

function parseServiceAccountJson(raw: string): admin.ServiceAccount {
  let json = raw.trim();
  if (
    (json.startsWith("'") && json.endsWith("'")) ||
    (json.startsWith('"') && json.endsWith('"'))
  ) {
    json = json.slice(1, -1).trim();
  }
  if (!json.startsWith("{")) {
    json = Buffer.from(json, "base64").toString("utf8").trim();
  }
  const lastBrace = json.lastIndexOf("}");
  if (json.startsWith("{") && lastBrace >= 0) {
    json = json.slice(0, lastBrace + 1);
  }
  try {
    return JSON.parse(json) as admin.ServiceAccount;
  } catch {
    // dotenv/Next могут развернуть \n внутри однострочного JSON.
    return JSON.parse(json.replace(/\r?\n/g, "\\n")) as admin.ServiceAccount;
  }
}

function parseServiceAccount(): admin.ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) {
    return null;
  }
  try {
    return parseServiceAccountJson(raw);
  } catch {
    console.error("[push] FIREBASE_SERVICE_ACCOUNT_JSON невалиден");
    return null;
  }
}

function getFirebaseMessaging(): admin.messaging.Messaging | null {
  const account = parseServiceAccount();
  if (!account) {
    return null;
  }
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(account),
    });
  }
  return admin.messaging();
}

export async function upsertCustomerPushToken(input: {
  customerId: string;
  token: string;
  platform: PushPlatform;
}): Promise<void> {
  const token = input.token.trim();
  await prisma.customerPushToken.upsert({
    where: { token },
    create: {
      customerId: input.customerId,
      token,
      platform: input.platform,
    },
    update: {
      customerId: input.customerId,
      platform: input.platform,
    },
  });
}

async function sendExpoPush(token: string, payload: PushPayload): Promise<boolean> {
  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: token,
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
        sound: "default",
      }),
    });
    return response.ok;
  } catch (error) {
    console.error("[push] Expo send failed", error);
    return false;
  }
}

async function sendFcmPush(token: string, payload: PushPayload): Promise<boolean> {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  const messaging = getFirebaseMessaging();
  if (!messaging) {
    console.warn(
      raw
        ? "[push] FCM-токен есть, но FIREBASE_SERVICE_ACCOUNT_JSON невалиден — пропуск"
        : "[push] FCM-токен есть, но FIREBASE_SERVICE_ACCOUNT_JSON не задан — пропуск",
    );
    return false;
  }
  try {
    await messaging.send({
      token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
      android: {
        priority: "high",
        notification: {
          channelId: "orders",
          sound: "default",
        },
      },
    });
    console.log("[push] FCM send ok");
    return true;
  } catch (error) {
    console.error("[push] FCM send failed", error);
    return false;
  }
}

export async function sendPushToCustomer(
  customerId: string,
  payload: PushPayload,
): Promise<void> {
  const rows = await prisma.customerPushToken.findMany({
    where: { customerId },
  });
  if (rows.length === 0) {
    return;
  }

  for (const row of rows) {
    if (isExpoPushToken(row.token)) {
      await sendExpoPush(row.token, payload);
    } else {
      await sendFcmPush(row.token, payload);
    }
  }
}

export async function notifyOrderCreated(
  customerId: string,
  orderId: string,
): Promise<void> {
  await sendPushToCustomer(customerId, {
    title: "Заказ оформлен",
    body: "Мы получили ваш заказ и скоро его проверим.",
    data: { type: "order_created", orderId },
  });
}

export async function notifyOrderConfirmed(
  customerId: string,
  orderId: string,
): Promise<void> {
  await sendPushToCustomer(customerId, {
    title: "Заказ подтверждён",
    body: "Склад подтвердил заказ. Можно следить за статусом в приложении.",
    data: { type: "order_confirmed", orderId },
  });
}

export async function notifyOrderRejected(
  customerId: string,
  orderId: string,
  reason: string,
): Promise<void> {
  const trimmed = reason.trim();
  await sendPushToCustomer(customerId, {
    title: "Заказ отклонён",
    body:
      trimmed.length > 0
        ? `Причина: ${trimmed}`
        : "К сожалению, заказ отклонили.",
    data: { type: "order_rejected", orderId },
  });
}
