import { CatalogItem } from "../domains/sales/catalogItem.model";
import { Proposal } from "../domains/sales/proposal.model";
import { ApprovalRequest } from "../domains/sales/approvalRequest.model";
import { calculateTotals } from "../domains/sales/sales.utils";
import type { SeedContext } from "./seedTypes";

const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

export const seedSales = async (ctx: SeedContext) => {
  const catalog = await CatalogItem.create([
    {
      orgId: ctx.org._id,
      name: "Plataforma CRM Base",
      description: "Assinatura base dos módulos de CRM.",
      unitPrice: 4800,
      currency: "BRL",
      active: true,
    },
    {
      orgId: ctx.org._id,
      name: "Pacote de Automação",
      description: "Automação de fluxos e alertas.",
      unitPrice: 2200,
      currency: "BRL",
      active: true,
    },
    {
      orgId: ctx.org._id,
      name: "Suite de Sucesso do Cliente",
      description: "Pontuação de saúde e gestão de renovações.",
      unitPrice: 3200,
      currency: "BRL",
      active: true,
    },
  ]);

  const proposalPayloads = [
    {
      company: ctx.companies[0],
      contact: ctx.contacts[0],
      deal: ctx.deals[0],
      status: "SENT",
      discountType: "PERCENT",
      discountValue: 5,
      items: [
        { catalogItemId: catalog[0]._id, name: catalog[0].name, qty: 1, unitPrice: 4800 },
        { catalogItemId: catalog[1]._id, name: catalog[1].name, qty: 1, unitPrice: 2200 },
      ],
    },
    {
      company: ctx.companies[1],
      contact: ctx.contacts[1],
      deal: ctx.deals[1],
      status: "DRAFT",
      discountType: "PERCENT",
      discountValue: 15,
      items: [
        { catalogItemId: catalog[0]._id, name: catalog[0].name, qty: 2, unitPrice: 4800 },
        { catalogItemId: catalog[2]._id, name: catalog[2].name, qty: 1, unitPrice: 3200 },
      ],
    },
    {
      company: ctx.companies[2],
      contact: ctx.contacts[2],
      deal: ctx.deals[2],
      status: "ACCEPTED",
      discountType: "NONE",
      discountValue: 0,
      items: [{ catalogItemId: catalog[0]._id, name: catalog[0].name, qty: 1, unitPrice: 4800 }],
    },
  ];

  const proposals = [];
  for (const payload of proposalPayloads) {
    const totals = calculateTotals({
      items: payload.items,
      discountType: payload.discountType as any,
      discountValue: payload.discountValue,
    });

    const proposal = await Proposal.create({
      orgId: ctx.org._id,
      companyId: payload.company._id,
      contactId: payload.contact._id,
      dealId: payload.deal._id,
      status: payload.status,
      items: payload.items.map((item) => ({
        catalogItemId: item.catalogItemId,
        name: item.name,
        qty: item.qty,
        unitPrice: item.unitPrice,
        total: item.qty * item.unitPrice,
      })),
      discountType: payload.discountType,
      discountValue: payload.discountValue,
      subtotal: totals.subtotal,
      total: totals.total,
      validUntil: daysFromNow(20),
      notes: "Inclui implantação e revisões trimestrais.",
      createdBy: ctx.users.user._id,
      sentAt: payload.status !== "DRAFT" ? daysFromNow(-2) : undefined,
    });

    if (totals.approvalRequired) {
      await ApprovalRequest.create({
        orgId: ctx.org._id,
        entity: "PROPOSAL",
        entityId: proposal._id.toString(),
        requestedBy: ctx.users.user._id,
        approverId: ctx.users.manager._id,
        status: "PENDING",
      });
    }

    proposals.push(proposal);
  }

  await ApprovalRequest.create({
    orgId: ctx.org._id,
    entity: "PROPOSAL",
    entityId: proposals[0]._id.toString(),
    requestedBy: ctx.users.user._id,
    approverId: ctx.users.manager._id,
    status: "APPROVED",
    resolvedAt: daysFromNow(-1),
  });

  return { catalog, proposals };
};
