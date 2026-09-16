import { ModalDialog } from "@/components/modal-dialog";
import { UI_MUTED_CLASS } from "@/lib/ui.shared";
import { formatPriceSomLabel } from "@/lib/products.shared";
import type { OrderStaffPublic } from "@/lib/orders.shared";

export function OrderItemsModal(props: {
  open: boolean;
  order: OrderStaffPublic | null;
  loading?: boolean;
  error?: string;
  onClose: () => void;
}) {
  const order = props.order;

  return (
    <ModalDialog
      open={props.open}
      title="Состав заказа"
      onClose={props.onClose}
    >
      {props.loading ? (
        <p className={UI_MUTED_CLASS}>Загрузка…</p>
      ) : props.error ? (
        <p className="text-sm text-red-700">{props.error}</p>
      ) : order ? (
        <div className="flex flex-col gap-3">
          <ul className="flex flex-col gap-2">
            {order.items.map((item) => {
              const notEnough =
                order.status === "PENDING" &&
                item.stockQuantityOnHand < item.quantity;
              return (
                <li
                  key={item.id}
                  className={`text-sm ${notEnough ? "text-red-700" : "text-zinc-800"}`}
                >
                  <p className="font-medium">{item.productName}</p>
                  <p className={notEnough ? "font-medium" : UI_MUTED_CLASS}>
                    {item.quantity} × {formatPriceSomLabel(item.priceCents)}
                    {order.status === "PENDING"
                      ? ` · ${item.stockQuantityOnHand} шт. на складе${
                          notEnough ? " — не хватает" : ""
                        }`
                      : ""}
                  </p>
                </li>
              );
            })}
          </ul>
          {order.promoCode ? (
            <p className={UI_MUTED_CLASS}>
              {order.promoCode}
              {order.discountCents > 0
                ? ` · −${formatPriceSomLabel(order.discountCents)}`
                : ""}
            </p>
          ) : null}
          <p className="text-sm font-semibold text-zinc-900">
            {formatPriceSomLabel(order.totalCents)}
          </p>
          {order.address ? (
            <p className={UI_MUTED_CLASS}>Адрес: {order.address}</p>
          ) : null}
          {order.status === "CONFIRMED" && order.etaMinutes ? (
            <p className={UI_MUTED_CLASS}>В пути ~{order.etaMinutes} мин</p>
          ) : null}
          {order.dgisUrl ? (
            <a
              href={order.dgisUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-zinc-800 underline underline-offset-2"
            >
              Открыть маршрут в 2ГИС
            </a>
          ) : null}
          {order.rejectionReason ? (
            <p className="text-sm text-red-700">{order.rejectionReason}</p>
          ) : null}
        </div>
      ) : null}
    </ModalDialog>
  );
}
