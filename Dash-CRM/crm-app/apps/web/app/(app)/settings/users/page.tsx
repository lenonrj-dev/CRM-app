"use client";

import { useEffect, useState } from "react";
import type { UserDTO } from "@ateliux/shared";
import { PageHeader } from "../../../../components/shared/PageHeader";
import { RequirePermission } from "../../../../components/shared/RequirePermission";
import { Button } from "../../../../components/ui/Button";
import { Drawer } from "../../../../components/ui/Drawer";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/Table";
import { createUser, listUsers } from "../../../../features/settings/users/api";
import { UserForm } from "../../../../features/settings/users/UserForm";
import { useAuth } from "../../../../features/auth/auth-context";
import { hasPermission } from "../../../../config/rbac";
import { formatEnumLabel } from "../../../../lib/labels";

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await listUsers();
      setUsers(data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const canCreate = hasPermission(user?.role, "users:write");

  const handleSubmit = async (payload: { name: string; email: string; password: string; role: UserDTO["role"] }) => {
    await createUser(payload);
    setDrawerOpen(false);
    await loadUsers();
  };

  return (
    <RequirePermission permission="users:read">
      <div>
        <PageHeader
          title="Usuários"
          subtitle="Membros da equipe e perfis"
          actions={
            canCreate ? (
              <Button onClick={() => setDrawerOpen(true)} pill>
                Novo usuário
              </Button>
            ) : null
          }
        />

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando usuários...</p> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Criado em</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {users.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-semibold">{item.name}</TableCell>
                <TableCell>{item.email}</TableCell>
                <TableCell>{formatEnumLabel(item.role)}</TableCell>
                <TableCell>{new Date(item.createdAt).toLocaleDateString("pt-BR")}</TableCell>
              </TableRow>
            ))}
            {!users.length && !loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-sm text-[var(--color-muted)]">
                  Nenhum usuário ainda.
                </TableCell>
              </TableRow>
            ) : null}
          </tbody>
        </Table>

        <Drawer open={drawerOpen} title="Novo usuário" onClose={() => setDrawerOpen(false)}>
          <UserForm onSubmit={handleSubmit} onCancel={() => setDrawerOpen(false)} />
        </Drawer>
      </div>
    </RequirePermission>
  );
}
