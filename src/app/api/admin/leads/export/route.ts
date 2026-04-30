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

function formatSpreadsheetDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatFilenameDate(value: string) {
  const date = new Date(value);
  const pad = (segment: number) => String(segment).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}

function formatLeadOrigin(value: string) {
  switch (value) {
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

function formatLeadStatus(value: string) {
  switch (value) {
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

function buildWorkbook(
  rows: Array<Record<string, string>>,
  exportedAt: string,
  exportedCount: number,
) {
  const worksheet = XLSX.utils.aoa_to_sheet([
    ["MESTRES INMOBILIARIA · Exportacion de leads"],
    [`Generado: ${formatSpreadsheetDate(exportedAt)} · Leads exportados: ${exportedCount}`],
    [],
    Object.keys(rows[0] ?? {}),
    ...rows.map((row) => Object.values(row)),
  ]);

  worksheet["!cols"] = [
    { wch: 20 },
    { wch: 38 },
    { wch: 30 },
    { wch: 26 },
    { wch: 24 },
    { wch: 18 },
    { wch: 28 },
    { wch: 42 },
    { wch: 16 },
    { wch: 16 },
  ];
  worksheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
  ];
  worksheet["!autofilter"] = { ref: "A4:J4" };

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Leads CRM");
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
  const spreadsheetRows = data.map((lead) => ({
    "Fecha de ingreso": lead.created_at ? formatSpreadsheetDate(lead.created_at) : "",
    "Codigo del lead": lead.id ?? "",
    Propiedad: lead.property_title_snapshot ?? "",
    Ubicacion: lead.property_location_snapshot ?? "",
    Nombre: lead.full_name ?? "",
    Telefono: lead.phone ?? "",
    Email: lead.email ?? "",
    Mensaje: lead.message ?? "",
    Origen: formatLeadOrigin(lead.origin ?? ""),
    Estado: formatLeadStatus(lead.status ?? ""),
  }));
  const workbookBuffer = buildWorkbook(spreadsheetRows, exportedAt, data.length);

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
      "Content-Disposition": `attachment; filename="leads-mestres-${formatFilenameDate(exportedAt)}.xlsx"`,
      "X-Exported-Count": String(exportedLeadIds.length),
      "X-Exported-At": exportedAt,
      "X-Export-Batch-Id": exportBatchId,
    },
  });
}
