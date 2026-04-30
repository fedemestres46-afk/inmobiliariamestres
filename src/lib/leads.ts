import {
  mapLeadRow,
  type Lead,
  type LeadRow,
} from "@/data/leads";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase";

const leadSelect =
  "id, property_id, property_title_snapshot, property_location_snapshot, full_name, phone, email, message, notes, origin, status, scheduled_at, google_event_id, created_at, updated_at, last_edited_by_email, last_edited_by_user_id, exported_at, export_batch_id, properties(id, title, location)";
const legacyLeadSelect =
  "id, property_id, property_title_snapshot, property_location_snapshot, full_name, phone, email, message, notes, origin, status, created_at, updated_at, properties(id, title, location)";

function isMissingRelationError(error: { message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    message.includes("relation") ||
    message.includes("does not exist") ||
    message.includes("schema cache") ||
    message.includes("scheduled_at") ||
    message.includes("google_event_id") ||
    message.includes("last_edited_by_email") ||
    message.includes("last_edited_by_user_id") ||
    message.includes("exported_at") ||
    message.includes("export_batch_id")
  );
}

export async function getLeads() {
  if (!isSupabaseAdminConfigured()) {
    return { leads: [] as Lead[], ready: false };
  }

  try {
    const supabase = getSupabaseAdminClient();
    let data: LeadRow[] | null = null;
    let error:
      | {
          message?: string;
          code?: string;
        }
      | null = null;

    const initialResult = await supabase
      .from("leads")
      .select(leadSelect)
      .order("created_at", { ascending: false });
    data = (initialResult.data as unknown as LeadRow[] | null) ?? null;
    error = initialResult.error;

    if (error && isMissingRelationError(error)) {
      const legacyResult = await supabase
        .from("leads")
        .select(legacyLeadSelect)
        .order("created_at", { ascending: false });
      data = (legacyResult.data as unknown as LeadRow[] | null) ?? null;
      error = legacyResult.error;
    }

    if (error || !data) {
      if (isMissingRelationError(error)) {
        return { leads: [] as Lead[], ready: false };
      }

      console.error("No se pudieron leer leads desde Supabase.", error);
      return { leads: [] as Lead[], ready: true };
    }

    return { leads: (data as unknown as LeadRow[]).map(mapLeadRow), ready: true };
  } catch (error) {
    console.error("Fallo la lectura de leads.", error);
    return { leads: [] as Lead[], ready: false };
  }
}

export async function getLeadById(id: string) {
  const supabase = getSupabaseAdminClient();
  let data: LeadRow | null = null;
  let error:
    | {
        message?: string;
        code?: string;
      }
    | null = null;

  const initialResult = await supabase
    .from("leads")
    .select(leadSelect)
    .eq("id", id)
    .single();
  data = (initialResult.data as unknown as LeadRow | null) ?? null;
  error = initialResult.error;

  if (error && isMissingRelationError(error)) {
    const legacyResult = await supabase
      .from("leads")
      .select(legacyLeadSelect)
      .eq("id", id)
      .single();
    data = (legacyResult.data as unknown as LeadRow | null) ?? null;
    error = legacyResult.error;
  }

  if (error || !data) {
    return null;
  }

  return mapLeadRow(data as LeadRow);
}
