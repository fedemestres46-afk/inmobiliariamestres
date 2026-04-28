import { NextResponse } from "next/server";
import { getLeadById } from "@/lib/leads";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase";

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "El backend todavia no esta listo para guardar consultas." },
      { status: 503 },
    );
  }

  const body = (await request.json()) as {
    propertyId?: string;
    fullName?: string;
    phone?: string;
    email?: string;
    message?: string;
  };

  const propertyId = body.propertyId?.trim();
  const fullName = body.fullName?.trim();
  const phone = body.phone?.trim();
  const email = body.email?.trim() || null;
  const message = body.message?.trim() || null;

  if (!propertyId || !fullName || !phone) {
    return NextResponse.json(
      { error: "Faltan datos para registrar la consulta." },
      { status: 400 },
    );
  }

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

  return NextResponse.json({ lead });
}
