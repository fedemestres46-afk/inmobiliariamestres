import { type LeadStatus } from "@/data/leads";

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

const validLeadStatuses: LeadStatus[] = [
  "Nuevo",
  "Contactado",
  "Visita",
  "Negociacion",
  "Cerrado",
  "Descartado",
];

export type PublicLeadPayload = {
  propertyId: string;
  fullName: string;
  phone: string;
  email: string | null;
  message: string | null;
};

export type AdminLeadPayload = {
  status?: LeadStatus;
  notes?: string | null;
  scheduledAt?: string | null;
};

export function validatePublicLeadPayload(body: unknown): ValidationResult<PublicLeadPayload> {
  if (!isObject(body)) {
    return { success: false, error: "No se recibieron datos validos para la consulta." };
  }

  const propertyId = parseTrimmedString(body.propertyId);
  const fullName = parseTrimmedString(body.fullName);
  const phone = parseTrimmedString(body.phone);
  const email = parseTrimmedString(body.email);
  const message = parseTrimmedString(body.message);

  if (!propertyId) {
    return { success: false, error: "La propiedad asociada no es valida." };
  }

  if (fullName.length < 3) {
    return { success: false, error: "El nombre debe tener al menos 3 caracteres." };
  }

  if (phone.length < 6) {
    return { success: false, error: "El telefono debe tener al menos 6 caracteres." };
  }

  if (email && !isValidEmail(email)) {
    return { success: false, error: "El email no tiene un formato valido." };
  }

  return {
    success: true,
    data: {
      propertyId,
      fullName,
      phone,
      email: email || null,
      message: message || null,
    },
  };
}

export function validateAdminLeadPayload(body: unknown): ValidationResult<AdminLeadPayload> {
  if (!isObject(body)) {
    return { success: false, error: "No se recibieron datos validos para el lead." };
  }

  const nextPayload: AdminLeadPayload = {};

  if (body.status !== undefined) {
    const status = parseTrimmedString(body.status);
    if (!validLeadStatuses.includes(status as LeadStatus)) {
      return { success: false, error: "El estado del lead no es valido." };
    }
    nextPayload.status = status as LeadStatus;
  }

  if (body.notes !== undefined) {
    const notes = parseTrimmedString(body.notes);
    nextPayload.notes = notes || null;
  }

  if (body.scheduledAt !== undefined) {
    const scheduledAt = parseTrimmedString(body.scheduledAt);
    if (scheduledAt) {
      const parsed = new Date(scheduledAt);
      if (Number.isNaN(parsed.getTime())) {
        return { success: false, error: "La fecha de visita no es valida." };
      }
    }
    nextPayload.scheduledAt = scheduledAt || null;
  }

  return { success: true, data: nextPayload };
}
