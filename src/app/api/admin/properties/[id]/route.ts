import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { type PropertyRow } from "@/data/properties";
import { getAdminSession } from "@/lib/auth";
import { getPropertyGallery, mapRowsWithGallery } from "@/lib/properties";
import { validatePropertyWritePayload } from "@/lib/property-validation";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
  propertyImagesBucket,
} from "@/lib/supabase";

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

  return nextPayload;
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

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
  const validation = validatePropertyWritePayload(body);

  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const updatePayload = validation.data;

  let { data, error } = await supabase
    .from("properties")
    .update(updatePayload)
    .eq("id", id)
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
    const legacyPayload = stripMissingExtendedFields(updatePayload, error);

    ({ data, error } = await supabase
      .from("properties")
      .update(legacyPayload)
      .eq("id", id)
      .select("*")
      .single());
  }

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
  revalidatePath("/");
  revalidatePath("/admin");

  return NextResponse.json({ property });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      {
        error:
          "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor. Con eso habilitamos borrado real.",
      },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  const supabase = getSupabaseAdminClient();
  const gallery = await getPropertyGallery(id);
  const pathsToRemove = gallery
    .map((imageUrl) => {
      const marker = `/storage/v1/object/public/${propertyImagesBucket}/`;
      const index = imageUrl.indexOf(marker);

      if (index === -1) {
        return null;
      }

      return imageUrl.slice(index + marker.length);
    })
    .filter((path): path is string => Boolean(path));

  if (pathsToRemove.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(propertyImagesBucket)
      .remove(pathsToRemove);

    if (storageError) {
      return NextResponse.json(
        {
          error:
            storageError.message ??
            "No se pudieron borrar las imagenes asociadas a la propiedad.",
        },
        { status: 500 },
      );
    }
  }

  const { error } = await supabase.from("properties").delete().eq("id", id);

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message ?? "No se pudo borrar la propiedad en Supabase.",
      },
      { status: 500 },
    );
  }

  revalidatePath("/");
  revalidatePath("/admin");

  return NextResponse.json({ success: true, id });
}
