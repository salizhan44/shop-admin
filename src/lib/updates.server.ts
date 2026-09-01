import { prisma } from "./prisma.server";
import { toUpdatesCheckPublic, type UpdatesCheckPublic } from "./updates.shared";

type UpdatesScope = {
  customerId?: string;
};

async function getLatestUpdatedAt(
  model: "order" | "supportTicket",
  scope: UpdatesScope,
): Promise<string | null> {
  if (model === "order") {
    const row = await prisma.order.findFirst({
      where: scope.customerId ? { customerId: scope.customerId } : undefined,
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    });
    return row?.updatedAt.toISOString() ?? null;
  }

  const row = await prisma.supportTicket.findFirst({
    where: scope.customerId ? { customerId: scope.customerId } : undefined,
    orderBy: { updatedAt: "desc" },
    select: { updatedAt: true },
  });
  return row?.updatedAt.toISOString() ?? null;
}

async function checkUpdates(
  model: "order" | "supportTicket",
  since: Date | null,
  scope: UpdatesScope,
): Promise<UpdatesCheckPublic> {
  const latestAt = await getLatestUpdatedAt(model, scope);

  if (!since) {
    return toUpdatesCheckPublic({ hasUpdates: false, latestAt });
  }

  const where = {
    ...(scope.customerId ? { customerId: scope.customerId } : {}),
    updatedAt: { gt: since },
  };

  const changed =
    model === "order"
      ? await prisma.order.count({ where })
      : await prisma.supportTicket.count({ where });

  return toUpdatesCheckPublic({
    hasUpdates: changed > 0,
    latestAt,
  });
}

export async function checkOrderUpdates(
  since: Date | null,
  scope: UpdatesScope = {},
): Promise<UpdatesCheckPublic> {
  return checkUpdates("order", since, scope);
}

export async function checkSupportTicketUpdates(
  since: Date | null,
  scope: UpdatesScope = {},
): Promise<UpdatesCheckPublic> {
  return checkUpdates("supportTicket", since, scope);
}

export async function getLatestOrderUpdatedAt(
  scope: UpdatesScope = {},
): Promise<string | null> {
  return getLatestUpdatedAt("order", scope);
}

export async function getLatestSupportTicketUpdatedAt(
  scope: UpdatesScope = {},
): Promise<string | null> {
  return getLatestUpdatedAt("supportTicket", scope);
}
