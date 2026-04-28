import {
  getSupabaseAdminClient,
  getSupabaseClient,
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
  propertyImagesBucket,
} from "@/lib/supabase";
import {
  mapPropertyRow,
  properties as mockProperties,
  type Property,
  type PropertyRow,
} from "@/data/properties";

export async function getPropertyGallery(propertyId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(propertyImagesBucket)
    .list(propertyId, {
      limit: 100,
      sortBy: { column: "name", order: "asc" },
    });

  if (error || !data) {
    return [];
  }

  return data
    .filter((item) => item.name)
    .map((item) => {
      const { data: publicUrl } = supabase.storage
        .from(propertyImagesBucket)
        .getPublicUrl(`${propertyId}/${item.name}`);
      return publicUrl.publicUrl;
    });
}

export async function mapRowsWithGallery(rows: PropertyRow[]) {
  return Promise.all(
    rows.map(async (row) => mapPropertyRow(row, await getPropertyGallery(row.id))),
  );
}

export async function getProperties(): Promise<Property[]> {
  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (error || !data) {
        console.error(
          "No se pudieron leer propiedades desde Supabase con rol admin.",
          error,
        );
      } else {
        return mapRowsWithGallery(data as PropertyRow[]);
      }
    } catch (error) {
      console.error("Fallo la lectura admin de Supabase.", error);
    }
  }

  if (!isSupabaseConfigured()) {
    return mockProperties;
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      console.error("No se pudieron leer propiedades desde Supabase.", error);
      return mockProperties;
    }

    return (data as PropertyRow[]).map((row) => mapPropertyRow(row));
  } catch (error) {
    console.error("Fallo la inicializacion de Supabase.", error);
    return mockProperties;
  }
}

export async function getPublishedProperties(): Promise<Property[]> {
  const properties = await getProperties();
  return properties.filter((property) => property.status === "Publicada");
}

export async function getPropertyBySlug(slug: string) {
  const properties = await getPublishedProperties();
  return properties.find((property) => property.slug === slug) ?? null;
}

export async function getRelatedProperties(propertyId: string, limit = 3) {
  const properties = await getPublishedProperties();
  return properties.filter((property) => property.id !== propertyId).slice(0, limit);
}
