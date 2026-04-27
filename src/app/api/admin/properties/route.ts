import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { type PropertyRow } from "@/data/properties";
import { mapRowsWithGallery } from "@/lib/properties";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export async function POST() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      {
        error:
          "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor. Con eso habilitamos altas reales.",
      },
      { status: 503 },
    );
  }

  const supabase = getSupabaseAdminClient();
  const baseTitle = "Nueva propiedad";
  const slug = `${slugify(baseTitle)}-${Date.now().toString().slice(-6)}`;

  const { data, error } = await supabase
    .from("properties")
    .insert({
      slug,
      title: baseTitle,
      location: "Rosario, Santa Fe",
      property_type: "Departamento",
      operation_type: "Venta",
      price: 0,
      currency: "USD",
      surface_m2: 0,
      bedrooms: 0,
      status: "draft",
      featured: false,
      cover_url:
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80",
      description: "Completa los datos de esta propiedad desde el panel admin.",
    })
    .select(
      "id, slug, title, location, property_type, operation_type, price, currency, surface_m2, bedrooms, status, featured, cover_url, description, latitude, longitude, maps_url",
    )
    .single();

  if (error || !data) {
    return NextResponse.json(
      {
        error: error?.message ?? "No se pudo crear la propiedad.",
      },
      { status: 500 },
    );
  }

  const [property] = await mapRowsWithGallery([data as PropertyRow]);
  revalidatePath("/");
  revalidatePath("/admin");

  return NextResponse.json({ property });
}
