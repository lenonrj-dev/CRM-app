export const catalogCurrencyValues = ["BRL", "USD", "EUR"] as const;
export type CatalogCurrency = typeof catalogCurrencyValues[number];

export type CatalogItemDTO = {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  unitPrice: number;
  currency: CatalogCurrency;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export const proposalStatusValues = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"] as const;
export type ProposalStatus = typeof proposalStatusValues[number];

export const discountTypeValues = ["NONE", "PERCENT", "FIXED"] as const;
export type DiscountType = typeof discountTypeValues[number];

export type ProposalItemDTO = {
  id?: string;
  catalogItemId?: string;
  name: string;
  qty: number;
  unitPrice: number;
  total: number;
};

export type ProposalDTO = {
  id: string;
  orgId: string;
  companyId: string;
  contactId?: string;
  dealId?: string;
  status: ProposalStatus;
  items: ProposalItemDTO[];
  discountType: DiscountType;
  discountValue: number;
  subtotal: number;
  total: number;
  validUntil?: string;
  notes?: string;
  createdBy: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
};

export const approvalStatusValues = ["PENDING", "APPROVED", "REJECTED"] as const;
export type ApprovalStatus = typeof approvalStatusValues[number];

export type ApprovalRequestDTO = {
  id: string;
  orgId: string;
  entity: "PROPOSAL";
  entityId: string;
  requestedBy: string;
  approverId: string;
  status: ApprovalStatus;
  reason?: string;
  createdAt: string;
  resolvedAt?: string;
};
