"use client";

import { useEffect, useState } from "react";
import type { TeamDTO, UnitDTO } from "@ateliux/shared";
import { PageHeader } from "../../../../../components/shared/PageHeader";
import { RequirePermission } from "../../../../../components/shared/RequirePermission";
import { Button } from "../../../../../components/ui/Button";
import { Drawer } from "../../../../../components/ui/Drawer";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "../../../../../components/ui/Table";
import { TeamForm } from "../../../../../features/settings/org/TeamForm";
import { createTeam, deleteTeam, listTeams, listUnits, updateTeam } from "../../../../../features/settings/org/api";

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamDTO[]>([]);
  const [units, setUnits] = useState<UnitDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<TeamDTO | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [teamData, unitData] = await Promise.all([listTeams(), listUnits()]);
      setTeams(teamData.items);
      setUnits(unitData.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (payload: Partial<TeamDTO>) => {
    if (editing) {
      await updateTeam(editing.id, payload);
    } else {
      await createTeam(payload);
    }
    setDrawerOpen(false);
    await loadData();
  };

  const handleDelete = async (teamId: string) => {
    await deleteTeam(teamId);
    await loadData();
  };

  const unitById = units.reduce<Record<string, UnitDTO>>((acc, unit) => {
    acc[unit.id] = unit;
    return acc;
  }, {});

  return (
    <RequirePermission permission="org:read">
      <div>
        <PageHeader
          title="Times"
          subtitle="Agrupe membros por metas e carteiras."
          actions={
            <Button onClick={() => { setEditing(null); setDrawerOpen(true); }} pill>
              Novo time
            </Button>
          }
        />

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando times...</p> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Cor</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <tbody>
            {teams.map((team) => (
              <TableRow key={team.id}>
                <TableCell className="font-semibold">{team.name}</TableCell>
                <TableCell>{team.unitId ? unitById[team.unitId]?.name ?? "-" : "-"}</TableCell>
                <TableCell>{team.color ?? "-"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => { setEditing(team); setDrawerOpen(true); }}>
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(team.id)}>
                      Excluir
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!teams.length && !loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-sm text-[var(--color-muted)]">
                  Nenhum time ainda.
                </TableCell>
              </TableRow>
            ) : null}
          </tbody>
        </Table>

        <Drawer open={drawerOpen} title={editing ? "Editar time" : "Novo time"} onClose={() => setDrawerOpen(false)}>
          <TeamForm
            initial={editing ?? undefined}
            units={units}
            onSubmit={handleSubmit}
            onCancel={() => setDrawerOpen(false)}
          />
        </Drawer>
      </div>
    </RequirePermission>
  );
}
