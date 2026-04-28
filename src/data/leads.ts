export type LeadStatus =
  | "Nuevo"
  | "Contactado"
  | "Visita"
  | "Negociacion"
  | "Cerrado"
  | "Descartado";

export type LeadOrigin = "Web" | "WhatsApp" | "Zonaprop" | "Manual";

export type Lead = {
  id: string;
  propertyId?: string;
  propertyTitle: string;
  propertyLocation?: string;
  fullName: string;
  phone: string;
  email?: string;
  message?: string;
  notes?: string;
  origin: LeadOrigin;
  status: LeadStatus;
  createdAt: string;
  scheduledAt?: string;
  scheduledAtValue?: string;
  calendarSyncStatus?: "Pendiente" | "Sincronizado";
};

export type LeadRow = {
  id: string;
  property_id: string | null;
  property_title_snapshot: string;
  property_location_snapshot: string | null;
  full_name: string;
  phone: string;
  email: string | null;
  message: string | null;
  notes: string | null;
  origin: "web" | "whatsapp" | "zonaprop" | "manual";
  status:
    | "new"
    | "contacted"
    | "visit"
    | "negotiation"
    | "closed"
    | "discarded";
  scheduled_at?: string | null;
  google_event_id?: string | null;
  created_at: string;
  properties?:
    | {
        id: string;
        title: string;
        location: string;
      }
    | {
        id: string;
        title: string;
        location: string;
      }[]
    | null;
};

function mapLeadStatus(status: LeadRow["status"]): LeadStatus {
  switch (status) {
    case "contacted":
      return "Contactado";
    case "visit":
      return "Visita";
    case "negotiation":
      return "Negociacion";
    case "closed":
      return "Cerrado";
    case "discarded":
      return "Descartado";
    default:
      return "Nuevo";
  }
}

export function toApiLeadStatus(status: LeadStatus): LeadRow["status"] {
  switch (status) {
    case "Contactado":
      return "contacted";
    case "Visita":
      return "visit";
    case "Negociacion":
      return "negotiation";
    case "Cerrado":
      return "closed";
    case "Descartado":
      return "discarded";
    default:
      return "new";
  }
}

function mapLeadOrigin(origin: LeadRow["origin"]): LeadOrigin {
  switch (origin) {
    case "whatsapp":
      return "WhatsApp";
    case "zonaprop":
      return "Zonaprop";
    case "manual":
      return "Manual";
    default:
      return "Web";
  }
}

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function mapLeadRow(row: LeadRow): Lead {
  const propertyRelation = Array.isArray(row.properties)
    ? row.properties[0]
    : row.properties;

  return {
    id: row.id,
    propertyId: row.property_id ?? undefined,
    propertyTitle: propertyRelation?.title ?? row.property_title_snapshot,
    propertyLocation:
      propertyRelation?.location ?? row.property_location_snapshot ?? undefined,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email ?? undefined,
    message: row.message ?? undefined,
    notes: row.notes ?? undefined,
    origin: mapLeadOrigin(row.origin),
    status: mapLeadStatus(row.status),
    createdAt: formatCreatedAt(row.created_at),
    scheduledAt: row.scheduled_at ? formatCreatedAt(row.scheduled_at) : undefined,
    scheduledAtValue: row.scheduled_at
      ? new Date(row.scheduled_at).toISOString().slice(0, 16)
      : undefined,
    calendarSyncStatus: row.google_event_id ? "Sincronizado" : undefined,
  };
}
