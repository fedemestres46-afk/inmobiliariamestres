import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { logAdminActivity } from "@/lib/activity";
import { getAdminWriteAccess } from "@/lib/auth";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase";

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

function getStatusFill(value: string) {
  switch (value) {
    case "Cerrado":
      return "FFE6F4EA";
    case "Descartado":
      return "FFFBE4E2";
    case "Visita":
      return "FFE7F1F8";
    case "Contactado":
      return "FFEFF5FA";
    case "Negociacion":
      return "FFFBF3D9";
    default:
      return "FFF7EBDD";
  }
}

function getOriginFill(value: string) {
  switch (value) {
    case "WhatsApp":
      return "FFE8F5E9";
    case "Zonaprop":
      return "FFE8EEF9";
    case "Manual":
      return "FFF3EAFB";
    default:
      return "FFF4F0EA";
  }
}

async function buildWorkbook(
  rows: Array<{
    fechaIngreso: string;
    codigoLead: string;
    propiedad: string;
    ubicacion: string;
    nombre: string;
    telefono: string;
    email: string;
    mensaje: string;
    origen: string;
    estado: string;
  }>,
  exportedAt: string,
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Leads CRM", {
    views: [{ state: "frozen", ySplit: 4 }],
  });

  worksheet.columns = [
    { header: "Fecha de ingreso", key: "fechaIngreso", width: 20 },
    { header: "Codigo del lead", key: "codigoLead", width: 38 },
    { header: "Propiedad", key: "propiedad", width: 30 },
    { header: "Ubicacion", key: "ubicacion", width: 26 },
    { header: "Nombre", key: "nombre", width: 24 },
    { header: "Telefono", key: "telefono", width: 18 },
    { header: "Email", key: "email", width: 28 },
    { header: "Mensaje", key: "mensaje", width: 42 },
    { header: "Origen", key: "origen", width: 16 },
    { header: "Estado", key: "estado", width: 16 },
  ];

  worksheet.mergeCells("A1:J1");
  worksheet.mergeCells("A2:J2");

  const titleCell = worksheet.getCell("A1");
  titleCell.value = "MESTRES INMOBILIARIA";
  titleCell.font = {
    name: "Calibri",
    size: 18,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F3B4D" },
  };

  const subtitleCell = worksheet.getCell("A2");
  subtitleCell.value = `Exportacion de leads | Generado el ${formatSpreadsheetDate(exportedAt)} | Total: ${rows.length}`;
  subtitleCell.font = {
    name: "Calibri",
    size: 11,
    color: { argb: "FF3E4A52" },
  };
  subtitleCell.alignment = { horizontal: "center", vertical: "middle" };
  subtitleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF5EFE8" },
  };

  worksheet.getRow(1).height = 28;
  worksheet.getRow(2).height = 22;

  const headerRow = worksheet.getRow(4);
  headerRow.values = [
    undefined,
    "Fecha de ingreso",
    "Codigo del lead",
    "Propiedad",
    "Ubicacion",
    "Nombre",
    "Telefono",
    "Email",
    "Mensaje",
    "Origen",
    "Estado",
  ];
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF9F6B44" },
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FFE5D7C9" } },
      left: { style: "thin", color: { argb: "FFE5D7C9" } },
      bottom: { style: "thin", color: { argb: "FFE5D7C9" } },
      right: { style: "thin", color: { argb: "FFE5D7C9" } },
    };
  });

  rows.forEach((row, index) => {
    const excelRow = worksheet.addRow(row);
    excelRow.height = 20;
    excelRow.eachCell((cell) => {
      cell.alignment = { vertical: "top", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: "FFECE4DA" } },
        left: { style: "thin", color: { argb: "FFECE4DA" } },
        bottom: { style: "thin", color: { argb: "FFECE4DA" } },
        right: { style: "thin", color: { argb: "FFECE4DA" } },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: index % 2 === 0 ? "FFFFFFFF" : "FFFCF8F3",
        },
      };
      cell.font = {
        name: "Calibri",
        size: 10.5,
        color: { argb: "FF22313B" },
      };
    });

    excelRow.getCell("I").alignment = { horizontal: "center", vertical: "middle" };
    excelRow.getCell("J").alignment = { horizontal: "center", vertical: "middle" };
    excelRow.getCell("I").font = {
      name: "Calibri",
      size: 10,
      bold: true,
      color: { argb: "FF44515B" },
    };
    excelRow.getCell("J").font = {
      name: "Calibri",
      size: 10,
      bold: true,
      color: { argb: "FF44515B" },
    };
    excelRow.getCell("I").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: getOriginFill(row.origen) },
    };
    excelRow.getCell("J").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: getStatusFill(row.estado) },
    };
  });

  worksheet.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: 4, column: 10 },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
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
      "id, property_title_snapshot, property_location_snapshot, full_name, phone, email, message, origin, status, created_at",
    )
    .order("created_at", { ascending: true });

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "No se pudieron preparar los leads para exportar." },
      { status: 500 },
    );
  }

  if (data.length === 0) {
    return NextResponse.json(
      { error: "Todavia no hay leads para exportar." },
      { status: 409 },
    );
  }

  const exportBatchId = crypto.randomUUID();
  const exportedAt = new Date().toISOString();

  const workbookBuffer = await buildWorkbook(
    data.map((lead) => ({
      fechaIngreso: lead.created_at ? formatSpreadsheetDate(lead.created_at) : "",
      codigoLead: lead.id ?? "",
      propiedad: lead.property_title_snapshot ?? "",
      ubicacion: lead.property_location_snapshot ?? "",
      nombre: lead.full_name ?? "",
      telefono: lead.phone ?? "",
      email: lead.email ?? "",
      mensaje: lead.message ?? "",
      origen: formatLeadOrigin(lead.origin ?? ""),
      estado: formatLeadStatus(lead.status ?? ""),
    })),
    exportedAt,
  );

  const exportedLeadIds = data.map((lead) => lead.id).filter(Boolean);

  await logAdminActivity({
    entityType: "lead",
    entityLabel: "Exportacion de leads",
    action: "export",
    summary: `Exporto ${exportedLeadIds.length} lead(s) del CRM a Excel.`,
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
