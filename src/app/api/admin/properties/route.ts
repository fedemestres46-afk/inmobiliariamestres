import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { type PropertyRow } from "@/data/properties";
import { logAdminActivity } from "@/lib/activity";
import { getAdminWriteAccess } from "@/lib/auth";
import { mapRowsWithGallery } from "@/lib/properties";
import { validatePropertyWritePayload } from "@/lib/property-validation";
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
    error?.message?.includes("garage_spaces") ||
    error?.message?.includes("last_edited_by_email") ||
    error?.message?.includes("last_edited_by_user_id")
  );
}

function isMissingFeatureTags(error?: { code?: string; message?: string } | null) {
  return (
    error?.message?.includes("service_tags") ||
    error?.message?.includes("amenity_tags")
  );
}

function stripMissingExtendedFields<T extends Record<string, unknown>>(
  payload: T,
  error?: { message?: string } | null,
) {
  if (!error?.message) {
    return payload;
  }

  const nextPayload = { ...payload };

  if (error.message.includes("covered_surface_m2")) {
    delete nextPayload.covered_surface_m2;
  }

  if (error.message.includes("rooms")) {
    delete nextPayload.rooms;
  }

  if (error.message.includes("bathrooms")) {
    delete nextPayload.bathrooms;
  }

  if (error.message.includes("garage_spaces")) {
    delete nextPayload.garage_spaces;
  }

  if (error.message.includes("last_edited_by_email")) {
    delete nextPayload.last_edited_by_email;
  }

  if (error.message.includes("last_edited_by_user_id")) {
    delete nextPayload.last_edited_by_user_id;
  }

  return nextPayload;
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
  const session = await getAdminWriteAccess();
  if (!session) {
    return NextResponse.json(
      { error: "No autorizado para crear propiedades." },
      { status: 403 },
    );
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
  const validation = validatePropertyWritePayload({
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
    status: "Borrador",
    featured: false,
    cover_url:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80",
    description: "Completa los datos de esta propiedad desde el panel admin.",
  });

  if (!validation.success) {
    return NextResponse.json(
      {
        error: validation.error,
      },
      { status: 500 },
    );
  }

  const basePayload = {
    slug,
    ...validation.data,
    last_edited_by_user_id: session.sub,
    last_edited_by_email: session.email,
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
    const legacyPayload = stripMissingExtendedFields(basePayload, error);

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
  const activity = await logAdminActivity({
    entityType: "property",
    entityId: property.id,
    entityLabel: property.title,
    action: "create",
    summary: `Creo la propiedad ${property.title}.`,
    actorUserId: session.sub,
    actorEmail: session.email,
    actorRole: session.role,
  });
  revalidatePath("/");
  revalidatePath("/admin");

  return NextResponse.json({ property, activity });
}
