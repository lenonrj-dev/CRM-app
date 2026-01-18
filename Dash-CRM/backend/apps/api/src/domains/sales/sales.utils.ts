import { discountTypeValues, type DiscountType } from "@ateliux/shared";

const threshold = Number(process.env.APPROVAL_DISCOUNT_THRESHOLD ?? 10);

export const calculateTotals = (params: {
  items: Array<{ qty: number; unitPrice: number }>;
  discountType: DiscountType;
  discountValue: number;
}) => {
  const { items, discountType, discountValue } = params;
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  let total = subtotal;

  if (discountType === "PERCENT") {
    total = subtotal - subtotal * (discountValue / 100);
  }

  if (discountType === "FIXED") {
    total = subtotal - discountValue;
  }

  total = Math.max(0, total);

  const approvalRequired =
    discountType !== "NONE" &&
    (discountType === "PERCENT" ? discountValue > threshold : (subtotal > 0 && (discountValue / subtotal) * 100 > threshold));

  return { subtotal, total, approvalRequired };
};

export const discountTypeGuard = (value: string): value is DiscountType =>
  discountTypeValues.includes(value as DiscountType);
