import { NextResponse } from "next/server";
import { getLeadById } from "@/lib/leads";
import { validatePublicLeadPayload } from "@/lib/lead-validation";
import { syncLeadToGoogleSheets } from "@/lib/google-sheets";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase";

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "El backend todavia no esta listo para guardar consultas." },
      { status: 503 },
    );
  }

  const body = await request.json();
  const validation = validatePublicLeadPayload(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { propertyId, fullName, phone, email, message } = validation.data;

  const supabase = getSupabaseAdminClient();
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id, title, location")
    .eq("id", propertyId)
    .single();

  if (propertyError || !property) {
    return NextResponse.json(
      { error: "No se encontro la propiedad asociada a esta consulta." },
      { status: 404 },
    );
  }

  const { data, error } = await supabase
    .from("leads")
    .insert({
      property_id: property.id,
      property_title_snapshot: property.title,
      property_location_snapshot: property.location,
      full_name: fullName,
      phone,
      email,
      message,
      origin: "web",
      status: "new",
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      {
        error:
          error?.message ??
          "No se pudo guardar la consulta en el CRM.",
      },
      { status: 500 },
    );
  }

  const lead = await getLeadById(data.id);

  if (lead) {
    try {
      await syncLeadToGoogleSheets({
        leadId: lead.id,
        propertyTitle: lead.propertyTitle,
        propertyLocation: lead.propertyLocation,
        fullName: lead.fullName,
        phone: lead.phone,
        email: lead.email,
        message: lead.message,
        origin: lead.origin,
        status: lead.status,
        createdAt: lead.createdAt,
      });
    } catch (error) {
      console.error("No se pudo sincronizar el lead con Google Sheets.", error);
    }
  }

  return NextResponse.json({ lead });
}
