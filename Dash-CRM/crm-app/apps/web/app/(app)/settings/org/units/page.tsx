"use client";

import { useEffect, useState } from "react";
import type { UnitDTO } from "@ateliux/shared";
import { PageHeader } from "../../../../../components/shared/PageHeader";
import { RequirePermission } from "../../../../../components/shared/RequirePermission";
import { Button } from "../../../../../components/ui/Button";
import { Drawer } from "../../../../../components/ui/Drawer";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "../../../../../components/ui/Table";
import { UnitForm } from "../../../../../features/settings/org/UnitForm";
import { createUnit, deleteUnit, listUnits, updateUnit } from "../../../../../features/settings/org/api";

export default function UnitsPage() {
  const [units, setUnits] = useState<UnitDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<UnitDTO | null>(null);

  const loadUnits = async () => {
    setLoading(true);
    try {
      const data = await listUnits();
      setUnits(data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnits();
  }, []);

  const handleSubmit = async (payload: Partial<UnitDTO>) => {
    if (editing) {
      await updateUnit(editing.id, payload);
    } else {
      await createUnit(payload);
    }
    setDrawerOpen(false);
    await loadUnits();
  };

  const handleDelete = async (unitId: string) => {
    await deleteUnit(unitId);
    await loadUnits();
  };

  return (
    <RequirePermission permission="org:read">
      <div>
        <PageHeader
          title="Unidades"
          subtitle="Gerencie unidades de negócio e hubs regionais."
          actions={
            <Button onClick={() => { setEditing(null); setDrawerOpen(true); }} pill>
              Nova unidade
            </Button>
          }
        />

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando unidades...</p> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Região</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <tbody>
            {units.map((unit) => (
              <TableRow key={unit.id}>
                <TableCell className="font-semibold">{unit.name}</TableCell>
                <TableCell>{unit.region ?? "-"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => { setEditing(unit); setDrawerOpen(true); }}>
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(unit.id)}>
                      Excluir
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!units.length && !loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-sm text-[var(--color-muted)]">
                  Nenhuma unidade ainda.
                </TableCell>
              </TableRow>
            ) : null}
          </tbody>
        </Table>

        <Drawer open={drawerOpen} title={editing ? "Editar unidade" : "Nova unidade"} onClose={() => setDrawerOpen(false)}>
          <UnitForm
            initial={editing ?? undefined}
            onSubmit={handleSubmit}
            onCancel={() => setDrawerOpen(false)}
          />
        </Drawer>
      </div>
    </RequirePermission>
  );
}
