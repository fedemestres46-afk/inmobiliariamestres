export type AdminActivityEntity = "property" | "lead";

export type AdminActivity = {
  id: string;
  entityType: AdminActivityEntity;
  entityId?: string;
  entityLabel: string;
  action: string;
  summary: string;
  actorEmail: string;
  actorRole?: string;
  createdAt: string;
};

export type AdminActivityRow = {
  id: string;
  entity_type: AdminActivityEntity;
  entity_id: string | null;
  entity_label: string;
  action: string;
  summary: string;
  actor_email: string;
  actor_role: string | null;
  created_at: string;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function mapAdminActivityRow(row: AdminActivityRow): AdminActivity {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id ?? undefined,
    entityLabel: row.entity_label,
    action: row.action,
    summary: row.summary,
    actorEmail: row.actor_email,
    actorRole: row.actor_role ?? undefined,
    createdAt: formatDateTime(row.created_at),
  };
}
