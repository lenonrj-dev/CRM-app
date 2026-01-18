"use client";

import { useEffect, useState } from "react";
import type { CatalogItemDTO } from "@ateliux/shared";
import { PageHeader } from "../../../../components/shared/PageHeader";
import { RequirePermission } from "../../../../components/shared/RequirePermission";
import { StatusBadge } from "../../../../components/shared/StatusBadge";
import { Button } from "../../../../components/ui/Button";
import { Drawer } from "../../../../components/ui/Drawer";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/Table";
import { useAuth } from "../../../../features/auth/auth-context";
import { hasPermission } from "../../../../config/rbac";
import { CatalogItemForm } from "../../../../features/sales/catalog/CatalogItemForm";
import {
  createCatalogItem,
  deleteCatalogItem,
  listCatalogItems,
  updateCatalogItem,
} from "../../../../features/sales/catalog/api";
import { formatCurrency } from "../../../../lib/utils";

export default function SalesCatalogPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<CatalogItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItemDTO | null>(null);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await listCatalogItems();
      setItems(data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleSubmit = async (payload: Partial<CatalogItemDTO>) => {
    if (editing) {
      await updateCatalogItem(editing.id, payload);
    } else {
      await createCatalogItem(payload);
    }
    setDrawerOpen(false);
    await loadItems();
  };

  const handleDelete = async (itemId: string) => {
    await deleteCatalogItem(itemId);
    await loadItems();
  };

  const canWrite = hasPermission(user?.role, "sales:write");

  return (
    <RequirePermission permission="sales:read">
      <div>
        <PageHeader
          title="Catálogo"
          subtitle="Gerencie itens de catálogo de serviços e assinaturas."
          actions={
            canWrite ? (
              <Button onClick={() => { setEditing(null); setDrawerOpen(true); }} pill>
                Novo item
              </Button>
            ) : null
          }
        />

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando catálogo...</p> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Moeda</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <tbody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-semibold">{item.name}</TableCell>
                <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                <TableCell>{item.currency}</TableCell>
                <TableCell>
                  <StatusBadge label={item.active ? "Ativo" : "Inativo"} tone={item.active ? "success" : "neutral"} />
                </TableCell>
                <TableCell className="text-right">
                  {canWrite ? (
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="secondary" size="sm" onClick={() => { setEditing(item); setDrawerOpen(true); }}>
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                        Excluir
                      </Button>
                    </div>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
            {!items.length && !loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-sm text-[var(--color-muted)]">
                  Nenhum item de catálogo ainda.
                </TableCell>
              </TableRow>
            ) : null}
          </tbody>
        </Table>

        <Drawer
          open={drawerOpen}
          title={editing ? "Editar item" : "Novo item de catálogo"}
          onClose={() => setDrawerOpen(false)}
        >
          <CatalogItemForm
            initial={editing ?? undefined}
            onSubmit={handleSubmit}
            onCancel={() => setDrawerOpen(false)}
          />
        </Drawer>
      </div>
    </RequirePermission>
  );
}
