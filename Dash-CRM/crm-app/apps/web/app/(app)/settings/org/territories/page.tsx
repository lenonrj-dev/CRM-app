"use client";

import { useEffect, useState } from "react";
import type { TeamDTO, TerritoryDTO, UnitDTO, UserDTO } from "@ateliux/shared";
import { PageHeader } from "../../../../../components/shared/PageHeader";
import { RequirePermission } from "../../../../../components/shared/RequirePermission";
import { Button } from "../../../../../components/ui/Button";
import { Drawer } from "../../../../../components/ui/Drawer";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "../../../../../components/ui/Table";
import { TerritoryForm } from "../../../../../features/settings/org/TerritoryForm";
import { createTerritory, deleteTerritory, listTeams, listTerritories, listUnits, updateTerritory } from "../../../../../features/settings/org/api";
import { listUsers } from "../../../../../features/settings/users/api";

export default function TerritoriesPage() {
  const [territories, setTerritories] = useState<TerritoryDTO[]>([]);
  const [units, setUnits] = useState<UnitDTO[]>([]);
  const [teams, setTeams] = useState<TeamDTO[]>([]);
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<TerritoryDTO | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [territoryData, unitData, teamData, userData] = await Promise.all([
        listTerritories(),
        listUnits(),
        listTeams(),
        listUsers(),
      ]);
      setTerritories(territoryData.items);
      setUnits(unitData.items);
      setTeams(teamData.items);
      setUsers(userData.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (payload: Partial<TerritoryDTO>) => {
    if (editing) {
      await updateTerritory(editing.id, payload);
    } else {
      await createTerritory(payload);
    }
    setDrawerOpen(false);
    await loadData();
  };

  const handleDelete = async (territoryId: string) => {
    await deleteTerritory(territoryId);
    await loadData();
  };

  const unitById = units.reduce<Record<string, UnitDTO>>((acc, unit) => {
    acc[unit.id] = unit;
    return acc;
  }, {});

  const teamById = teams.reduce<Record<string, TeamDTO>>((acc, team) => {
    acc[team.id] = team;
    return acc;
  }, {});

  const userById = users.reduce<Record<string, UserDTO>>((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

  return (
    <RequirePermission permission="org:read">
      <div>
        <PageHeader
          title="Territórios"
          subtitle="Automatize regras de atribuição por região e segmento."
          actions={
            <Button onClick={() => { setEditing(null); setDrawerOpen(true); }} pill>
              Novo território
            </Button>
          }
        />

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando territórios...</p> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Regras</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <tbody>
            {territories.map((territory) => (
              <TableRow key={territory.id}>
                <TableCell className="font-semibold">{territory.name}</TableCell>
                <TableCell>{territory.unitId ? unitById[territory.unitId]?.name ?? "-" : "-"}</TableCell>
                <TableCell>{territory.teamId ? teamById[territory.teamId]?.name ?? "-" : "-"}</TableCell>
                <TableCell>{territory.ownerId ? userById[territory.ownerId]?.name ?? "-" : "-"}</TableCell>
                <TableCell className="text-xs text-[var(--color-muted)]">
                  {(territory.rules?.regions ?? []).join(", ") || "Qualquer"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => { setEditing(territory); setDrawerOpen(true); }}>
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(territory.id)}>
                      Excluir
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!territories.length && !loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-sm text-[var(--color-muted)]">
                  Nenhum território ainda.
                </TableCell>
              </TableRow>
            ) : null}
          </tbody>
        </Table>

        <Drawer
          open={drawerOpen}
          title={editing ? "Editar território" : "Novo território"}
          onClose={() => setDrawerOpen(false)}
        >
          <TerritoryForm
            initial={editing ?? undefined}
            units={units}
            teams={teams}
            users={users}
            onSubmit={handleSubmit}
            onCancel={() => setDrawerOpen(false)}
          />
        </Drawer>
      </div>
    </RequirePermission>
  );
}
