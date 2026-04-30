import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { logAdminActivity } from "@/lib/activity";
import { getAdminWriteAccess } from "@/lib/auth";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase";

function isMissingExportColumns(error?: { code?: string; message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    error?.code === "PGRST204" ||
    error?.code === "42703" ||
    message.includes("exported_at") ||
    message.includes("export_batch_id") ||
    message.includes("schema cache")
  );
}

function buildWorkbook(rows: Array<Record<string, string>>) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

export async function POST() {
  const session = await getAdminWriteAccess();
  if (!session) {
    return NextResponse.json(
      { error: "No autorizado para exportar leads." },
      { status: 403 },
    );
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Falta la configuracion del backend para exportar leads." },
      { status: 503 },
    );
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, property_title_snapshot, property_location_snapshot, full_name, phone, email, message, origin, status, created_at, exported_at",
    )
    .is("exported_at", null)
    .order("created_at", { ascending: true });

  if (error || !data) {
    if (isMissingExportColumns(error)) {
      return NextResponse.json(
        {
          error:
            "Faltan las columnas de exportacion en Supabase. Corre el SQL de supabase/lead-export-fields.sql para habilitar Exportar todo.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error?.message ?? "No se pudieron preparar los leads para exportar." },
      { status: 500 },
    );
  }

  if (data.length === 0) {
    return NextResponse.json(
      { error: "No hay leads nuevos para exportar. Ya fueron exportados anteriormente." },
      { status: 409 },
    );
  }

  const exportBatchId = crypto.randomUUID();
  const exportedAt = new Date().toISOString();

  const workbookBuffer = buildWorkbook(
    data.map((lead) => ({
      "Fecha de ingreso": lead.created_at ?? "",
      "Lead ID": lead.id ?? "",
      Propiedad: lead.property_title_snapshot ?? "",
      Ubicacion: lead.property_location_snapshot ?? "",
      Nombre: lead.full_name ?? "",
      Telefono: lead.phone ?? "",
      Email: lead.email ?? "",
      Mensaje: lead.message ?? "",
      Origen: lead.origin ?? "",
      Estado: lead.status ?? "",
    })),
  );

  const exportedLeadIds = data.map((lead) => lead.id).filter(Boolean);

  const { error: updateError } = await supabase
    .from("leads")
    .update({
      exported_at: exportedAt,
      export_batch_id: exportBatchId,
    })
    .in("id", exportedLeadIds);

  if (updateError) {
    if (isMissingExportColumns(updateError)) {
      return NextResponse.json(
        {
          error:
            "Faltan las columnas de exportacion en Supabase. Corre el SQL de supabase/lead-export-fields.sql para habilitar Exportar todo.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: updateError.message ?? "No se pudo marcar la exportacion de leads." },
      { status: 500 },
    );
  }

  await logAdminActivity({
    entityType: "lead",
    entityLabel: "Exportacion de leads",
    action: "export",
    summary: `Exporto ${exportedLeadIds.length} lead(s) nuevos a Excel.`,
    actorUserId: session.sub,
    actorEmail: session.email,
    actorRole: session.role,
    metadata: { exportBatchId, exportedLeadIds },
  });

  return new NextResponse(workbookBuffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="leads-${exportBatchId}.xlsx"`,
      "X-Exported-Count": String(exportedLeadIds.length),
      "X-Exported-At": exportedAt,
      "X-Export-Batch-Id": exportBatchId,
    },
  });
}
