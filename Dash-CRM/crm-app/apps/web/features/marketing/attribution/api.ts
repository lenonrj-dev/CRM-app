import type { AttributionRowDTO } from "@ateliux/shared";
import { apiFetch } from "../../../lib/api";

export const listAttribution = () => apiFetch<{ items: AttributionRowDTO[] }>("/marketing/attribution");
