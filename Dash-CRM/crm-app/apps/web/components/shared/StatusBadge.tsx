import { Badge } from "../ui/Badge";
import { formatEnumLabel } from "../../lib/labels";

export function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger";
}) {
  return <Badge variant={tone ?? "neutral"}>{formatEnumLabel(label)}</Badge>;
}
