import {
  mapLeadRow,
  type Lead,
  type LeadRow,
} from "@/data/leads";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase";

const leadSelect =
  "id, property_id, property_title_snapshot, property_location_snapshot, full_name, phone, email, message, notes, origin, status, created_at, properties(id, title, location)";

function isMissingRelationError(error: { message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    message.includes("relation") ||
    message.includes("does not exist") ||
    message.includes("schema cache")
  );
}

export async function getLeads() {
  if (!isSupabaseAdminConfigured()) {
    return { leads: [] as Lead[], ready: false };
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("leads")
      .select(leadSelect)
      .order("created_at", { ascending: false });

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
  const { data, error } = await supabase
    .from("leads")
    .select(leadSelect)
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return mapLeadRow(data as LeadRow);
}
