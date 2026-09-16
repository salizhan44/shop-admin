import type { StatusTone } from "./ui.shared";

export const SUPPORT_TICKET_STATUSES = ["OPEN", "CLOSED"] as const;

export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];

export const SUPPORT_IMAGE_MAX_COUNT = 5;
export const SUPPORT_IMAGE_URL_MAX_LENGTH = 2_500_000;

export type SupportTicketPublic = {
  id: string;
  subject: string;
  body: string;
  imageUrls: string[];
  status: SupportTicketStatus;
  staffReply: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SupportTicketStaffPublic = SupportTicketPublic & {
  customerName: string;
  customerEmail: string;
};

export type SupportTicketCreateBody = {
  subject: string;
  body: string;
  /** data:image… для новых фото (необязательно). */
  imageUrls?: string[];
};

export type SupportTicketCloseBody = {
  reply: string;
};

export function isSupportTicketCreateBody(
  value: unknown,
): value is SupportTicketCreateBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const body = value as Record<string, unknown>;
  if (typeof body.subject !== "string" || typeof body.body !== "string") {
    return false;
  }
  if ("imageUrls" in body) {
    if (!Array.isArray(body.imageUrls)) {
      return false;
    }
    if (!body.imageUrls.every((item) => typeof item === "string")) {
      return false;
    }
  }
  return true;
}

export function isSupportTicketCloseBody(
  value: unknown,
): value is SupportTicketCloseBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const body = value as Record<string, unknown>;
  return typeof body.reply === "string";
}

export function supportImageFileName(imageUrl: string): string | null {
  const pathOnly = imageUrl.split("?")[0] ?? "";
  if (!pathOnly.startsWith("/uploads/support/")) {
    return null;
  }
  const name = pathOnly.slice("/uploads/support/".length);
  if (
    !name ||
    name.includes("..") ||
    name.includes("/") ||
    name.includes("\\")
  ) {
    return null;
  }
  return name;
}

export function validateSupportImageUrl(imageUrl: string): string | null {
  if (imageUrl.length === 0) {
    return "Пустое фото";
  }
  if (imageUrl.startsWith("/uploads/support/")) {
    return null;
  }
  if (imageUrl.length > SUPPORT_IMAGE_URL_MAX_LENGTH) {
    return "Файл фото слишком большой — выберите изображение поменьше";
  }
  if (!imageUrl.startsWith("data:image/")) {
    return "Нужна картинка JPEG/PNG/WebP";
  }
  return null;
}

export function toSupportTicketPublic(input: {
  id: string;
  subject: string;
  body: string;
  imageUrls: string[];
  status: SupportTicketStatus;
  staffReply: string | null;
  createdAt: Date;
  updatedAt: Date;
}): SupportTicketPublic {
  return {
    id: input.id,
    subject: input.subject,
    body: input.body,
    imageUrls: input.imageUrls,
    status: input.status,
    staffReply: input.staffReply,
    createdAt: input.createdAt.toISOString(),
    updatedAt: input.updatedAt.toISOString(),
  };
}

export function toSupportTicketStaffPublic(input: {
  id: string;
  subject: string;
  body: string;
  imageUrls: string[];
  status: SupportTicketStatus;
  staffReply: string | null;
  createdAt: Date;
  updatedAt: Date;
  customer: { name: string; email: string };
}): SupportTicketStaffPublic {
  return {
    ...toSupportTicketPublic(input),
    customerName: input.customer.name,
    customerEmail: input.customer.email,
  };
}

export function supportTicketStatusLabel(status: SupportTicketStatus): string {
  switch (status) {
    case "OPEN":
      return "Открыто";
    case "CLOSED":
      return "Закрыто";
  }
}

export function supportTicketStatusTone(
  status: SupportTicketStatus,
): StatusTone {
  return status === "OPEN" ? "pending" : "ok";
}

export function formatSupportTicketDate(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU");
}

export type SupportTicketListFilter = SupportTicketStatus;

export type SupportTicketListFilterOption = {
  value: SupportTicketListFilter;
  label: string;
};

export const SUPPORT_TICKET_LIST_FILTERS: readonly SupportTicketListFilterOption[] =
  [
    { value: "OPEN", label: "Открытые" },
    { value: "CLOSED", label: "Закрытые" },
  ];

export function filterSupportTickets<T extends { status: SupportTicketStatus }>(
  tickets: readonly T[],
  filter: SupportTicketListFilter,
): T[] {
  return tickets.filter((ticket) => ticket.status === filter);
}
