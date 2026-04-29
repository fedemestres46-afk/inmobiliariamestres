import {
  mapAdminActivityRow,
  type AdminActivity,
  type AdminActivityEntity,
  type AdminActivityRow,
} from "@/data/admin-activity";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase";

type LogAdminActivityInput = {
  entityType: AdminActivityEntity;
  entityId?: string;
  entityLabel: string;
  action: string;
  summary: string;
  actorUserId?: string;
  actorEmail: string;
  actorRole?: string;
  metadata?: Record<string, unknown>;
};

function isMissingActivityTable(error?: { message?: string; code?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    error?.code === "PGRST204" ||
    error?.code === "42P01" ||
    message.includes("admin_activity_log") ||
    message.includes("relation") ||
    message.includes("schema cache")
  );
}

export async function getRecentAdminActivity(limit = 24) {
  if (!isSupabaseAdminConfigured()) {
    return { activities: [] as AdminActivity[], ready: false };
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("admin_activity_log")
      .select("id, entity_type, entity_id, entity_label, action, summary, actor_email, actor_role, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) {
      if (isMissingActivityTable(error)) {
        return { activities: [] as AdminActivity[], ready: false };
      }

      console.error("No se pudo leer el historial de actividad admin.", error);
      return { activities: [] as AdminActivity[], ready: true };
    }

    return {
      activities: (data as AdminActivityRow[]).map(mapAdminActivityRow),
      ready: true,
    };
  } catch (error) {
    console.error("Fallo la lectura del historial de actividad.", error);
    return { activities: [] as AdminActivity[], ready: false };
  }
}

export async function logAdminActivity(input: LogAdminActivityInput) {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("admin_activity_log")
      .insert({
        entity_type: input.entityType,
        entity_id: input.entityId ?? null,
        entity_label: input.entityLabel,
        action: input.action,
        summary: input.summary,
        actor_user_id: input.actorUserId ?? null,
        actor_email: input.actorEmail,
        actor_role: input.actorRole ?? null,
        metadata: input.metadata ?? null,
      })
      .select("id, entity_type, entity_id, entity_label, action, summary, actor_email, actor_role, created_at")
      .single();

    if (error || !data) {
      if (!isMissingActivityTable(error)) {
        console.error("No se pudo guardar actividad admin.", error);
      }

      return null;
    }

    return mapAdminActivityRow(data as AdminActivityRow);
  } catch (error) {
    console.error("Fallo el guardado de actividad admin.", error);
    return null;
  }
}
