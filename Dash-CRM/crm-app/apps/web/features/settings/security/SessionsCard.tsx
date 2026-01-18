"use client";

import type { SessionDTO } from "@ateliux/shared";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/Table";
import { formatDateTime } from "../../../lib/utils";

export function SessionsCard({
  sessions,
  loading,
  onRevokeAll,
  onRevoke,
}: {
  sessions: SessionDTO[];
  loading: boolean;
  onRevokeAll: () => void;
  onRevoke: (id: string) => void;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sessões</h2>
        <Button variant="ghost" onClick={onRevokeAll}>
          Revogar todas
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID da sessão</TableHead>
            <TableHead>Criada em</TableHead>
            <TableHead>Expira em</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <tbody>
          {sessions.map((session) => (
            <TableRow key={session.id}>
              <TableCell className="text-xs">{session.id}</TableCell>
              <TableCell>{formatDateTime(session.createdAt)}</TableCell>
              <TableCell>{formatDateTime(session.expiresAt)}</TableCell>
              <TableCell>{session.revokedAt ? "Revogada" : "Ativa"}</TableCell>
              <TableCell className="text-right">
                {!session.revokedAt ? (
                  <Button variant="secondary" size="sm" onClick={() => onRevoke(session.id)}>
                    Revogar
                  </Button>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
          {!sessions.length ? (
            <TableRow>
              <TableCell colSpan={5} className="text-sm text-[var(--color-muted)]">
                {loading ? "Carregando sessões..." : "Nenhuma sessão encontrada."}
              </TableCell>
            </TableRow>
          ) : null}
        </tbody>
      </Table>
    </Card>
  );
}
