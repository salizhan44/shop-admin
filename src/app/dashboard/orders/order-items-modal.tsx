import { ModalDialog } from "@/components/modal-dialog";
import { UI_MUTED_CLASS } from "@/lib/ui.shared";
import { formatPriceSomLabel } from "@/lib/products.shared";
import type { OrderStaffPublic } from "@/lib/orders.shared";

export function OrderItemsModal(props: {
  order: OrderStaffPublic | null;
  onClose: () => void;
}) {
  const order = props.order;

  return (
    <ModalDialog
      open={order !== null}
      title="Состав заказа"
      onClose={props.onClose}
    >
      {order ? (
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
          {order.rejectionReason ? (
            <p className="text-sm text-red-700">{order.rejectionReason}</p>
          ) : null}
        </div>
      ) : null}
    </ModalDialog>
  );
}
