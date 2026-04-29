import { NextResponse } from "next/server";
import { toApiLeadStatus } from "@/data/leads";
import { getAdminSession } from "@/lib/auth";
import { getLeadById } from "@/lib/leads";
import { validateAdminLeadPayload } from "@/lib/lead-validation";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function shouldRetryWithoutCalendarFields(error?: { code?: string; message?: string } | null) {
  return (
    error?.code === "PGRST204" ||
    error?.code === "42703" ||
    error?.message?.includes("scheduled_at") ||
    error?.message?.includes("google_event_id")
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Falta la configuracion del backend para editar leads." },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  const body = await request.json();
  const validation = validateAdminLeadPayload(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const updatePayload = {
    ...(validation.data.status
      ? { status: toApiLeadStatus(validation.data.status) }
      : {}),
    ...(validation.data.notes !== undefined
      ? { notes: validation.data.notes }
      : {}),
    ...(validation.data.scheduledAt !== undefined
      ? { scheduled_at: validation.data.scheduledAt || null }
      : {}),
  };

  let { error } = await supabase
    .from("leads")
    .update(updatePayload)
    .eq("id", id);

  if (error && shouldRetryWithoutCalendarFields(error)) {
    const { scheduled_at: _scheduledAt, ...legacyPayload } = updatePayload;
    ({ error } = await supabase.from("leads").update(legacyPayload).eq("id", id));
  }

  if (error) {
    return NextResponse.json(
      {
        error: error.message ?? "No se pudo actualizar el lead.",
      },
      { status: 500 },
    );
  }

  const lead = await getLeadById(id);

  if (!lead) {
    return NextResponse.json(
      { error: "No se encontro el lead actualizado." },
      { status: 404 },
    );
  }

  return NextResponse.json({ lead });
}
