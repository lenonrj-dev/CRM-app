"use client";

import { useEffect, useState } from "react";
import type { TeamDTO, UnitDTO, UserDTO } from "@ateliux/shared";
import { PageHeader } from "../../../../../components/shared/PageHeader";
import { RequirePermission } from "../../../../../components/shared/RequirePermission";
import { Button } from "../../../../../components/ui/Button";
import { Drawer } from "../../../../../components/ui/Drawer";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "../../../../../components/ui/Table";
import { MemberForm } from "../../../../../features/settings/org/MemberForm";
import { createMember, listMembers, listTeams, listUnits, updateMember } from "../../../../../features/settings/org/api";
import { listUsers } from "../../../../../features/settings/users/api";
import { formatEnumLabel } from "../../../../../lib/labels";

export default function MembersPage() {
  const [members, setMembers] = useState<Array<any>>([]);
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [units, setUnits] = useState<UnitDTO[]>([]);
  const [teams, setTeams] = useState<TeamDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [memberData, userData, unitData, teamData] = await Promise.all([
        listMembers(),
        listUsers(),
        listUnits(),
        listTeams(),
      ]);
      setMembers(memberData.items);
      setUsers(userData.items);
      setUnits(unitData.items);
      setTeams(teamData.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (payload: any) => {
    if (editing) {
      await updateMember(editing.id, payload);
    } else {
      await createMember(payload);
    }
    setDrawerOpen(false);
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

  return (
    <RequirePermission permission="org:read">
      <div>
        <PageHeader
          title="Membros"
          subtitle="Defina perfis, escopo e visibilidade de time."
          actions={
            <Button
              onClick={() => {
                setEditing(null);
                setDrawerOpen(true);
              }}
              pill
            >
              Adicionar membro
            </Button>
          }
        />

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando membros...</p> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Escopo</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <tbody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-semibold">{member.user?.name ?? member.userId}</TableCell>
                <TableCell>{formatEnumLabel(member.role)}</TableCell>
                <TableCell>{formatEnumLabel(member.scope)}</TableCell>
                <TableCell>{member.unitId ? unitById[member.unitId]?.name ?? "-" : "-"}</TableCell>
                <TableCell>{member.teamIds?.[0] ? teamById[member.teamIds[0]]?.name ?? "-" : "-"}</TableCell>
                <TableCell>{formatEnumLabel(member.status)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEditing(member);
                      setDrawerOpen(true);
                    }}
                  >
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!members.length && !loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-sm text-[var(--color-muted)]">
                  Nenhum membro encontrado.
                </TableCell>
              </TableRow>
            ) : null}
          </tbody>
        </Table>

        <Drawer
          open={drawerOpen}
          title={editing ? "Editar membro" : "Adicionar membro"}
          onClose={() => setDrawerOpen(false)}
        >
          <MemberForm
            initial={editing ?? undefined}
            users={users}
            units={units}
            teams={teams}
            onSubmit={handleSubmit}
            onCancel={() => setDrawerOpen(false)}
          />
        </Drawer>
      </div>
    </RequirePermission>
  );
}
