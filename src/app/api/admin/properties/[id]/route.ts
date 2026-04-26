import { NextResponse } from "next/server";
import { type PropertyRow } from "@/data/properties";
import { mapRowsWithGallery } from "@/lib/properties";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      {
        error:
          "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor. Con eso habilitamos guardado real.",
      },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  const body = await request.json();
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("properties")
    .update({
      title: body.title,
      location: body.location,
      property_type: body.property_type,
      operation_type: body.operation_type,
      price: body.price,
      currency: body.currency,
      surface_m2: body.surface_m2,
      bedrooms: body.bedrooms,
      status: body.status,
      featured: body.featured,
      cover_url: body.cover_url,
      description: body.description,
      ...(body.latitude !== undefined ? { latitude: body.latitude } : {}),
      ...(body.longitude !== undefined ? { longitude: body.longitude } : {}),
      ...(body.maps_url !== undefined ? { maps_url: body.maps_url } : {}),
    })
    .eq("id", id)
    .select(
      "id, slug, title, location, property_type, operation_type, price, currency, surface_m2, bedrooms, status, featured, cover_url, description",
    )
    .single();

  if (error || !data) {
    return NextResponse.json(
      {
        error:
          error?.message ??
          "No se pudo actualizar la propiedad en Supabase.",
      },
      { status: 500 },
    );
  }

  const [property] = await mapRowsWithGallery([data as PropertyRow]);

  return NextResponse.json({ property });
}
