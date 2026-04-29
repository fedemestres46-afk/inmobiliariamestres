import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { type PropertyRow } from "@/data/properties";
import { getAdminWriteAccess } from "@/lib/auth";
import { getPropertyGallery, mapRowsWithGallery } from "@/lib/properties";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
  propertyImagesBucket,
} from "@/lib/supabase";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function sanitizeFilename(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ensureBucket() {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase.storage.getBucket(propertyImagesBucket);

  if (data) {
    return;
  }

  const { error } = await supabase.storage.createBucket(propertyImagesBucket, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/avif"],
  });

  if (error && !error.message.toLowerCase().includes("already exists")) {
    throw error;
  }
}

function getStoragePathFromPublicUrl(imageUrl: string) {
  const marker = `/storage/v1/object/public/${propertyImagesBucket}/`;
  const index = imageUrl.indexOf(marker);

  if (index === -1) {
    return null;
  }

  return imageUrl.slice(index + marker.length);
}

export async function POST(request: Request, context: RouteContext) {
  const session = await getAdminWriteAccess();
  if (!session) {
    return NextResponse.json(
      { error: "No autorizado para subir imagenes." },
      { status: 403 },
    );
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      {
        error:
          "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor. Con eso habilitamos la subida real de imagenes.",
      },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  const formData = await request.formData();
  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File);
  const singleFile = formData.get("file");

  if (files.length === 0 && singleFile instanceof File) {
    files.push(singleFile);
  }

  if (files.length === 0) {
    return NextResponse.json(
      { error: "No se recibio ningun archivo valido." },
      { status: 400 },
    );
  }

  await ensureBucket();

  const supabase = getSupabaseAdminClient();
  let firstUploadedPublicUrl: string | null = null;

  for (const [index, file] of files.entries()) {
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Solo se permiten imagenes." },
        { status: 400 },
      );
    }

    const filename = `${Date.now()}-${index}-${sanitizeFilename(file.name || "cover.jpg")}`;
    const path = `${id}/${filename}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(propertyImagesBucket)
      .upload(path, bytes, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 },
      );
    }

    if (!firstUploadedPublicUrl) {
      const { data: publicUrlData } = supabase.storage
        .from(propertyImagesBucket)
        .getPublicUrl(path);
      firstUploadedPublicUrl = publicUrlData.publicUrl;
    }
  }

  const { data, error } = await supabase
    .from("properties")
    .update(
      firstUploadedPublicUrl
        ? {
            cover_url: firstUploadedPublicUrl,
          }
        : {},
    )
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
          "La imagen se subio, pero no se pudo asociar a la propiedad.",
      },
      { status: 500 },
    );
  }

  const [property] = await mapRowsWithGallery([data as PropertyRow]);
  revalidatePath("/");
  revalidatePath("/admin");

  return NextResponse.json({ property });
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await getAdminWriteAccess();
  if (!session) {
    return NextResponse.json(
      { error: "No autorizado para borrar imagenes." },
      { status: 403 },
    );
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      {
        error:
          "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor. Con eso habilitamos la edicion real de imagenes.",
      },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  const body = (await request.json()) as { imageUrl?: string } | null;
  const imageUrl = body?.imageUrl?.trim();

  if (!imageUrl) {
    return NextResponse.json(
      { error: "Falta indicar que imagen quieres borrar." },
      { status: 400 },
    );
  }

  const storagePath = getStoragePathFromPublicUrl(imageUrl);
  if (!storagePath) {
    return NextResponse.json(
      { error: "No se pudo relacionar la imagen con el bucket publico." },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdminClient();
  const { data: currentProperty, error: propertyError } = await supabase
    .from("properties")
    .select(
      "id, slug, title, location, property_type, operation_type, price, currency, surface_m2, bedrooms, status, featured, cover_url, description, latitude, longitude, maps_url",
    )
    .eq("id", id)
    .single();

  if (propertyError || !currentProperty) {
    return NextResponse.json(
      { error: propertyError?.message ?? "No se encontro la propiedad." },
      { status: 404 },
    );
  }

  const { error: removeError } = await supabase.storage
    .from(propertyImagesBucket)
    .remove([storagePath]);

  if (removeError) {
    return NextResponse.json({ error: removeError.message }, { status: 500 });
  }

  const gallery = await getPropertyGallery(id);
  const nextCover = gallery[0] ?? null;
  const shouldUpdateCover = currentProperty.cover_url === imageUrl || !currentProperty.cover_url;

  const updatePayload = shouldUpdateCover
    ? {
        cover_url: nextCover,
      }
    : {};

  const { data, error } = await supabase
    .from("properties")
    .update(updatePayload)
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
          "La imagen se borro, pero no se pudo actualizar la propiedad.",
      },
      { status: 500 },
    );
  }

  const [property] = await mapRowsWithGallery([data as PropertyRow]);
  revalidatePath("/");
  revalidatePath("/admin");
  return NextResponse.json({ property });
}
