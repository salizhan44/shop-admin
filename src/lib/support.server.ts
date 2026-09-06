import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "./prisma.server";
import {
  SUPPORT_IMAGE_MAX_COUNT,
  toSupportTicketPublic,
  toSupportTicketStaffPublic,
  validateSupportImageUrl,
  type SupportTicketPublic,
  type SupportTicketStaffPublic,
} from "./support.shared";

const SUPPORT_IMAGE_DIR = path.join(
  process.cwd(),
  "public",
  "uploads",
  "support",
);

function parseDataImage(
  dataUrl: string,
): { ext: "jpg" | "png" | "webp"; buffer: Buffer } | null {
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

async function persistSupportImageDataUrl(
  ticketId: string,
  index: number,
  dataUrl: string,
): Promise<string | { error: string }> {
  const parsed = parseDataImage(dataUrl);
  if (!parsed) {
    return { error: "Нужна картинка JPEG/PNG/WebP" };
  }
  if (parsed.buffer.length > 1_500_000) {
    return { error: "Файл фото слишком большой — выберите изображение поменьше" };
  }
  await mkdir(SUPPORT_IMAGE_DIR, { recursive: true });
  const fileName = `${ticketId}-${index}.${parsed.ext}`;
  await writeFile(path.join(SUPPORT_IMAGE_DIR, fileName), parsed.buffer);
  return `/uploads/support/${fileName}?v=${Date.now()}`;
}

async function resolveSupportImageUrls(
  ticketId: string,
  imageUrls: string[] | undefined,
): Promise<string[] | { error: string }> {
  if (!imageUrls || imageUrls.length === 0) {
    return [];
  }
  if (imageUrls.length > SUPPORT_IMAGE_MAX_COUNT) {
    return {
      error: `Можно прикрепить не больше ${SUPPORT_IMAGE_MAX_COUNT} фото`,
    };
  }

  const saved: string[] = [];
  for (let index = 0; index < imageUrls.length; index += 1) {
    const raw = imageUrls[index]?.trim() ?? "";
    const validationError = validateSupportImageUrl(raw);
    if (validationError) {
      return { error: validationError };
    }
    if (raw.startsWith("/uploads/support/")) {
      saved.push(raw);
      continue;
    }
    const persisted = await persistSupportImageDataUrl(ticketId, index, raw);
    if (typeof persisted !== "string") {
      return persisted;
    }
    saved.push(persisted);
  }
  return saved;
}

export async function listSupportTicketsForCustomer(
  customerId: string,
): Promise<SupportTicketPublic[]> {
  const tickets = await prisma.supportTicket.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
  });
  return tickets.map((ticket) => toSupportTicketPublic(ticket));
}

export async function listSupportTicketsForStaff(): Promise<
  SupportTicketStaffPublic[]
> {
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: {
        select: { name: true, email: true },
      },
    },
  });
  return tickets.map((ticket) => toSupportTicketStaffPublic(ticket));
}

export async function createSupportTicket(
  customerId: string,
  input: { subject: string; body: string; imageUrls?: string[] },
): Promise<SupportTicketPublic | { error: string; status: number }> {
  const subject = input.subject.trim();
  const body = input.body.trim();

  if (!subject || !body) {
    return { error: "Укажите тему и текст обращения", status: 400 };
  }
  if (subject.length > 200) {
    return { error: "Тема не длиннее 200 символов", status: 400 };
  }
  if (body.length > 5000) {
    return { error: "Текст не длиннее 5000 символов", status: 400 };
  }
  if (input.imageUrls && input.imageUrls.length > SUPPORT_IMAGE_MAX_COUNT) {
    return {
      error: `Можно прикрепить не больше ${SUPPORT_IMAGE_MAX_COUNT} фото`,
      status: 400,
    };
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      customerId,
      subject,
      body,
      imageUrls: [],
      status: "OPEN",
    },
  });

  const imageUrls = await resolveSupportImageUrls(ticket.id, input.imageUrls);
  if (!Array.isArray(imageUrls)) {
    await prisma.supportTicket.delete({ where: { id: ticket.id } });
    return { error: imageUrls.error, status: 400 };
  }

  if (imageUrls.length === 0) {
    return toSupportTicketPublic(ticket);
  }

  const updated = await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: { imageUrls },
  });
  return toSupportTicketPublic(updated);
}

export async function closeSupportTicket(
  ticketId: string,
  reply: string,
): Promise<SupportTicketPublic | { error: string; status: number }> {
  const trimmedReply = reply.trim();
  if (!trimmedReply) {
    return { error: "Укажите ответ клиенту", status: 400 };
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
  });
  if (!ticket) {
    return { error: "Обращение не найдено", status: 404 };
  }
  if (ticket.status !== "OPEN") {
    return { error: "Обращение уже закрыто", status: 400 };
  }

  const updated = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      status: "CLOSED",
      staffReply: trimmedReply,
    },
  });
  return toSupportTicketPublic(updated);
}

export function isSupportError(
  value: SupportTicketPublic | { error: string; status: number },
): value is { error: string; status: number } {
  return "error" in value;
}
