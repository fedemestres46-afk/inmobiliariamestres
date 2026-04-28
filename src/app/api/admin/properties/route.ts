import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { type PropertyRow } from "@/data/properties";
import { getAdminSession } from "@/lib/auth";
import { mapRowsWithGallery } from "@/lib/properties";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase";

function getSupabaseProjectLabel() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) {
    return "sin URL configurada";
  }

  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function shouldRetryWithoutExtendedFields(error?: { code?: string; message?: string } | null) {
  return (
    error?.code === "PGRST204" ||
    error?.code === "42703" ||
    error?.message?.includes("covered_surface_m2") ||
    error?.message?.includes("rooms") ||
    error?.message?.includes("bathrooms") ||
    error?.message?.includes("garage_spaces")
  );
}

function isMissingFeatureTags(error?: { code?: string; message?: string } | null) {
  return (
    error?.code === "PGRST204" ||
    error?.code === "42703" ||
    error?.message?.includes("service_tags") ||
    error?.message?.includes("amenity_tags")
  );
}

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
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

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
  const basePayload = {
    slug,
    title: baseTitle,
    location: "Rosario, Santa Fe",
    property_type: "Departamento",
    operation_type: "Venta",
    price: 0,
    currency: "USD",
    surface_m2: 0,
    covered_surface_m2: 0,
    rooms: 0,
    bedrooms: 0,
    bathrooms: 0,
    garage_spaces: 0,
    service_tags: [],
    amenity_tags: [],
    status: "draft",
    featured: false,
    cover_url:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80",
    description: "Completa los datos de esta propiedad desde el panel admin.",
  };

  let { data, error } = await supabase
    .from("properties")
    .insert(basePayload)
    .select("*")
    .single();

  if (error && isMissingFeatureTags(error)) {
    return NextResponse.json(
      {
        error: `Faltan las columnas de servicios y adicionales en Supabase. La app esta apuntando a ${getSupabaseProjectLabel()}. Corre el SQL de supabase/property-feature-tags.sql en ese proyecto para poder guardar esos checks.`,
      },
      { status: 500 },
    );
  }

  if (error && shouldRetryWithoutExtendedFields(error)) {
    const {
      rooms: _rooms,
      covered_surface_m2: _coveredSurfaceM2,
      bathrooms: _bathrooms,
      garage_spaces: _garageSpaces,
      service_tags: _serviceTags,
      amenity_tags: _amenityTags,
      ...legacyPayload
    } = basePayload;

    ({ data, error } = await supabase
      .from("properties")
      .insert(legacyPayload)
      .select("*")
      .single());
  }

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
