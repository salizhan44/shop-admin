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
import { StatusBadge } from "@/components/status-badge";
import { UI_CARD_CLASS, UI_MUTED_CLASS } from "@/lib/ui.shared";
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
    return promo.freeProductName ?? "подарок";
  }
  return promoKindLabel(promo.kind);
}

function limitText(promo: PromoCodeAdmin): string {
  const total =
    promo.maxTotalRedemptions === null
      ? "без лимита"
      : `${promo.redemptionCount} / ${promo.maxTotalRedemptions}`;
  return `${total} · ${promo.maxPerCustomer} на клиента`;
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
      <PageHeader title="Промокоды" />
      <PromoForm products={products} />
      {promoCodes.length === 0 ? (
        <p className={UI_MUTED_CLASS}>Нет промокодов</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {promoCodes.map((promo) => (
            <li
              key={promo.id}
              className={`${UI_CARD_CLASS} px-5 py-4`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-zinc-900">{promo.code}</p>
                  <p className="mt-0.5 text-sm text-zinc-600">
                    {promoKindLabel(promo.kind)} · {effectText(promo)}
                  </p>
                  <p className={UI_MUTED_CLASS}>{limitText(promo)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge
                    label={promo.isActive ? "Включён" : "Выключен"}
                    tone={promo.isActive ? "ok" : "neutral"}
                  />
                  <PromoActiveToggle
                    promoId={promo.id}
                    isActive={promo.isActive}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
