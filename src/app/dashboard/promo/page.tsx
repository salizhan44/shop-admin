import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff-session.server";
import { canManagePromotions } from "@/lib/roles.shared";
import { listCatalogProducts } from "@/lib/products.server";
import { listPromoCodesForStaff } from "@/lib/promo.server";
import {
  promoKindLabel,
  type PromoCodeAdmin,
} from "@/lib/promo.shared";
import { formatPriceSomLabel } from "@/lib/products.shared";
import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/access-denied";
import { PromoForm } from "./promo-form";
import { PromoActiveToggle } from "./promo-active-toggle";

function effectText(promo: PromoCodeAdmin): string {
  if (promo.kind === "PERCENT" && promo.percentOff !== null) {
    return `−${promo.percentOff}%`;
  }
  if (promo.kind === "AMOUNT" && promo.amountOffCents !== null) {
    return `−${formatPriceSomLabel(promo.amountOffCents)}`;
  }
  if (promo.kind === "FREE_PRODUCT") {
    return `подарок: ${promo.freeProductName ?? "товар"}`;
  }
  return promoKindLabel(promo.kind);
}

function limitText(promo: PromoCodeAdmin): string {
  const total =
    promo.maxTotalRedemptions === null
      ? "без общего лимита"
      : `${promo.redemptionCount} из ${promo.maxTotalRedemptions} на всех`;
  return `${total} · до ${promo.maxPerCustomer} на клиента`;
}

export default async function PromoPage() {
  const session = await getStaffSession();
  if (!session) {
    redirect("/login");
  }
  if (!canManagePromotions(session.role)) {
    return (
      <AccessDenied
        title="Промокоды"
        message="Управление промокодами доступно только владельцу."
      />
    );
  }

  const [promoCodes, products] = await Promise.all([
    listPromoCodesForStaff(),
    listCatalogProducts(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Промокоды"
        description="Выберите, что делает код: процент, сумма, подарок или бесплатная доставка. Общий лимит — например, первые 100 человек."
      />
      <PromoForm products={products} />
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Список</h2>
        {promoCodes.length === 0 ? (
          <p className="text-sm text-zinc-600">Пока нет ни одного промокода.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {promoCodes.map((promo) => (
              <li
                key={promo.id}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{promo.code}</p>
                    <p className="text-sm text-zinc-600">
                      {promoKindLabel(promo.kind)} · {effectText(promo)}
                    </p>
                    <p className="text-sm text-zinc-600">{limitText(promo)}</p>
                    <p className="text-sm text-zinc-600">
                      {promo.isActive ? "Включён" : "Выключен"}
                    </p>
                  </div>
                  <PromoActiveToggle
                    promoId={promo.id}
                    isActive={promo.isActive}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
