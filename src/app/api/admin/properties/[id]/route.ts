import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { type PropertyRow } from "@/data/properties";
import { getAdminSession } from "@/lib/auth";
import { getPropertyGallery, mapRowsWithGallery } from "@/lib/properties";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
  propertyImagesBucket,
} from "@/lib/supabase";

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
      "id, slug, title, location, property_type, operation_type, price, currency, surface_m2, bedrooms, status, featured, cover_url, description, latitude, longitude, maps_url",
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
