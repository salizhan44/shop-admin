import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "./prisma.server";
import { hashPassword, verifyPassword } from "./password.server";
import { customerHasPassword, type CustomerPublic } from "./auth.shared";
import { toCustomerPublic } from "./customer-auth.server";
import {
  resolveCurrentPasswordCheck,
  resolveCustomerPasswordChange,
  validateAvatarUrl,
  validateCustomerName,
  validateHomeAddress,
  type CustomerCurrentPasswordBody,
  type CustomerPasswordChangeBody,
  type CustomerProfileUpdateBody,
} from "./customer-profile.shared";
import { clearStoredSupportImages } from "./support.server";

const AVATAR_DIR = path.join(process.cwd(), "public", "uploads", "avatars");

function parseDataImage(dataUrl: string): { ext: "jpg" | "png" | "webp"; buffer: Buffer } | null {
  const match = /^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i.exec(dataUrl);
  if (!match || !match[1] || !match[2]) {
    return null;
  }
  const kind = match[1].toLowerCase();
  const ext = kind === "png" ? "png" : kind === "webp" ? "webp" : "jpg";
  try {
    return { ext, buffer: Buffer.from(match[2], "base64") };
  } catch {
    return null;
  }
}

async function persistAvatarDataUrl(
  customerId: string,
  dataUrl: string,
): Promise<string | { error: string }> {
  const parsed = parseDataImage(dataUrl);
  if (!parsed) {
    return { error: "Нужна картинка JPEG/PNG" };
  }
  if (parsed.buffer.length > 900_000) {
    return { error: "Файл аватарки слишком большой — выберите фото поменьше" };
  }
  await mkdir(AVATAR_DIR, { recursive: true });
  const fileName = `${customerId}.${parsed.ext}`;
  const filePath = path.join(AVATAR_DIR, fileName);
  await writeFile(filePath, parsed.buffer);
  return `/uploads/avatars/${fileName}?v=${Date.now()}`;
}

async function clearStoredAvatarFile(customerId: string): Promise<void> {
  for (const ext of ["jpg", "png", "webp"] as const) {
    const filePath = path.join(AVATAR_DIR, `${customerId}.${ext}`);
    try {
      await unlink(filePath);
    } catch {
      // файла могло не быть
    }
  }
}

/** Старые data: URI не отдаём клиенту целиком — ломают JSON/SecureStore. */
async function normalizeStoredAvatar(
  customerId: string,
  avatarUrl: string,
): Promise<string> {
  if (!avatarUrl.startsWith("data:image/")) {
    return avatarUrl;
  }
  const saved = await persistAvatarDataUrl(customerId, avatarUrl);
  if (typeof saved !== "string") {
    await prisma.customer.update({
      where: { id: customerId },
      data: { avatarUrl: "" },
    });
    return "";
  }
  await prisma.customer.update({
    where: { id: customerId },
    data: { avatarUrl: saved },
  });
  return saved;
}

export async function getCustomerProfile(
  customerId: string,
): Promise<CustomerPublic | null> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      email: true,
      name: true,
      homeAddress: true,
      avatarUrl: true,
      passwordHash: true,
      loyaltyPoints: true,
    },
  });
  if (!customer) {
    return null;
  }
  const avatarUrl = await normalizeStoredAvatar(customerId, customer.avatarUrl);
  return toCustomerPublic({ ...customer, avatarUrl });
}

export async function updateCustomerProfile(
  customerId: string,
  body: CustomerProfileUpdateBody,
): Promise<{ customer: CustomerPublic } | { error: string }> {
  const data: {
    name?: string;
    homeAddress?: string;
    avatarUrl?: string;
  } = {};

  if (typeof body.name === "string") {
    const nameError = validateCustomerName(body.name);
    if (nameError) {
      return { error: nameError };
    }
    data.name = body.name.trim();
  }

  if (typeof body.homeAddress === "string") {
    const addressError = validateHomeAddress(body.homeAddress);
    if (addressError) {
      return { error: addressError };
    }
    data.homeAddress = body.homeAddress.trim();
  }

  if ("avatarUrl" in body) {
    if (body.avatarUrl === null || body.avatarUrl === "") {
      await clearStoredAvatarFile(customerId);
      data.avatarUrl = "";
    } else if (typeof body.avatarUrl === "string") {
      const avatarError = validateAvatarUrl(body.avatarUrl);
      if (avatarError) {
        return { error: avatarError };
      }
      if (body.avatarUrl.startsWith("data:image/")) {
        const saved = await persistAvatarDataUrl(customerId, body.avatarUrl);
        if (typeof saved !== "string") {
          return saved;
        }
        data.avatarUrl = saved;
      } else if (body.avatarUrl.startsWith("/uploads/avatars/")) {
        data.avatarUrl = body.avatarUrl;
      } else {
        return { error: "Нужна картинка" };
      }
    }
  }

  if (Object.keys(data).length === 0) {
    return { error: "Нечего сохранять" };
  }

  try {
    const customer = await prisma.customer.update({
      where: { id: customerId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        homeAddress: true,
        avatarUrl: true,
        passwordHash: true,
        loyaltyPoints: true,
      },
    });
    const avatarUrl = await normalizeStoredAvatar(
      customerId,
      customer.avatarUrl,
    );
    return { customer: toCustomerPublic({ ...customer, avatarUrl }) };
  } catch {
    return {
      error:
        "Не удалось сохранить профиль. Перезапустите сайт (admin) и попробуйте снова.",
    };
  }
}

export async function changeCustomerPassword(
  customerId: string,
  body: CustomerPasswordChangeBody,
): Promise<{ ok: true } | { error: string }> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { passwordHash: true },
  });
  if (!customer) {
    return { error: "Не найден" };
  }

  const hasStoredPassword = customerHasPassword(customer.passwordHash);
  const currentPasswordMatches =
    hasStoredPassword && customer.passwordHash
      ? await verifyPassword(body.currentPassword, customer.passwordHash)
      : false;
  const resolved = resolveCustomerPasswordChange({
    hasStoredPassword,
    currentPassword: body.currentPassword,
    newPassword: body.newPassword,
    currentPasswordMatches,
  });
  if ("error" in resolved) {
    return resolved;
  }

  await prisma.customer.update({
    where: { id: customerId },
    data: { passwordHash: await hashPassword(body.newPassword) },
  });
  return { ok: true };
}

export async function verifyCustomerPassword(
  customerId: string,
  body: CustomerCurrentPasswordBody,
): Promise<{ ok: true } | { error: string }> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { passwordHash: true },
  });
  if (!customer) {
    return { error: "Не найден" };
  }

  const hasStoredPassword = customerHasPassword(customer.passwordHash);
  const currentPasswordMatches =
    hasStoredPassword && customer.passwordHash
      ? await verifyPassword(body.currentPassword, customer.passwordHash)
      : false;
  return resolveCurrentPasswordCheck({
    hasStoredPassword,
    currentPassword: body.currentPassword,
    currentPasswordMatches,
  });
}

export async function addCustomerAppSeconds(
  customerId: string,
  seconds: number,
): Promise<{ ok: true } | { error: string }> {
  try {
    await prisma.customer.update({
      where: { id: customerId },
      data: { appSecondsTotal: { increment: seconds } },
    });
    return { ok: true };
  } catch {
    return { error: "Не удалось сохранить время" };
  }
}

export async function deleteCustomerAccount(
  customerId: string,
): Promise<{ ok: true } | { error: string; status: number }> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      supportTickets: { select: { imageUrls: true } },
    },
  });
  if (!customer) {
    return { error: "Не найден", status: 404 };
  }

  const supportImageUrls = customer.supportTickets.flatMap(
    (ticket) => ticket.imageUrls,
  );

  try {
    await prisma.$transaction(async (tx) => {
      const redemptions = await tx.promoRedemption.findMany({
        where: { customerId },
        select: { promoCodeId: true },
      });
      for (const row of redemptions) {
        await tx.promoCode.updateMany({
          where: { id: row.promoCodeId, redemptionCount: { gt: 0 } },
          data: { redemptionCount: { decrement: 1 } },
        });
      }
      await tx.promoRedemption.deleteMany({ where: { customerId } });
      await tx.order.deleteMany({ where: { customerId } });
      await tx.supportTicket.deleteMany({ where: { customerId } });
      await tx.customer.delete({ where: { id: customerId } });
    });
  } catch {
    return { error: "Не удалось удалить аккаунт", status: 500 };
  }

  await clearStoredAvatarFile(customerId);
  await clearStoredSupportImages(supportImageUrls);
  return { ok: true };
}
