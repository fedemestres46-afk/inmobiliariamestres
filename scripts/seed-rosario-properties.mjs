import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const envPath = path.join(projectRoot, ".env.local");

function loadEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) {
    return env;
  }

  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

const env = {
  ...loadEnvFile(envPath),
  ...process.env,
};

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const bucket = "property-images";

const properties = [
  {
    slug: "departamento-lourdes-amenabar",
    title: "Departamento luminoso con balcon en Lourdes",
    location: "Lourdes, Rosario",
    property_type: "Departamento",
    operation_type: "Venta",
    price: 119000,
    currency: "USD",
    surface_m2: 88,
    covered_surface_m2: 77,
    rooms: 4,
    bedrooms: 2,
    bathrooms: 2,
    garage_spaces: 1,
    description:
      "Departamento de dos dormitorios en una zona muy buscada de Rosario, con balcon corrido, cocina integrada y cochera.",
    status: "published",
    featured: true,
    latitude: -32.9518,
    longitude: -60.6582,
    maps_url: "https://maps.google.com/?q=-32.9518,-60.6582",
    service_tags: ["Agua corriente", "Gas natural", "Cloaca", "Electricidad"],
    amenity_tags: ["Aire acondicionado individual", "Balcon", "Lavadero"],
    imageUrls: [
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1502005097973-6a7082348e28?auto=format&fit=crop&w=1400&q=80",
    ],
  },
  {
    slug: "casa-fisherton-jardin-pileta",
    title: "Casa en Fisherton con jardin, pileta y quincho",
    location: "Fisherton, Rosario",
    property_type: "Casa",
    operation_type: "Venta",
    price: 286000,
    currency: "USD",
    surface_m2: 312,
    covered_surface_m2: 224,
    rooms: 6,
    bedrooms: 3,
    bathrooms: 3,
    garage_spaces: 2,
    description:
      "Casa desarrollada en dos plantas, con jardin amplio, pileta y quincho. Muy buena opcion para familia y reuniones.",
    status: "published",
    featured: true,
    latitude: -32.9195,
    longitude: -60.7312,
    maps_url: "https://maps.google.com/?q=-32.9195,-60.7312",
    service_tags: ["Agua corriente", "Gas natural", "Electricidad"],
    amenity_tags: ["Patio", "Pileta", "Parrillero", "Calefaccion", "Lavadero"],
    imageUrls: [
      "https://images.unsplash.com/photo-1576941089067-2de3c901e126?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1400&q=80",
    ],
  },
  {
    slug: "oficina-centro-corporativa-rosario",
    title: "Oficina corporativa con recepcion y sala de reuniones",
    location: "Centro, Rosario",
    property_type: "Oficina",
    operation_type: "Alquiler",
    price: 1250000,
    currency: "ARS",
    surface_m2: 102,
    covered_surface_m2: 102,
    rooms: 4,
    bedrooms: 0,
    bathrooms: 2,
    garage_spaces: 0,
    description:
      "Oficina corporativa en el centro de Rosario con recepcion, privado gerencial y sala de reuniones equipada.",
    status: "published",
    featured: false,
    latitude: -32.9468,
    longitude: -60.6389,
    maps_url: "https://maps.google.com/?q=-32.9468,-60.6389",
    service_tags: ["Agua corriente", "Electricidad", "Cloaca"],
    amenity_tags: ["Aire acondicionado individual", "Calefaccion", "Seguridad"],
    imageUrls: [
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1497366412874-3415097a27e7?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80",
    ],
  },
  {
    slug: "departamento-pichincha-amenities-rosario",
    title: "Departamento en Pichincha con amenities y cochera",
    location: "Pichincha, Rosario",
    property_type: "Departamento",
    operation_type: "Venta",
    price: 154000,
    currency: "USD",
    surface_m2: 106,
    covered_surface_m2: 89,
    rooms: 4,
    bedrooms: 2,
    bathrooms: 2,
    garage_spaces: 1,
    description:
      "Departamento moderno en una de las zonas mas activas de Rosario, con balcon, cochera y amenities del edificio.",
    status: "published",
    featured: false,
    latitude: -32.9378,
    longitude: -60.6587,
    maps_url: "https://maps.google.com/?q=-32.9378,-60.6587",
    service_tags: ["Agua corriente", "Gas natural", "Cloaca", "Electricidad"],
    amenity_tags: ["Balcon", "Seguridad", "Aire acondicionado individual"],
    imageUrls: [
      "https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80",
    ],
  },
  {
    slug: "casa-alberdi-patio-terraza",
    title: "Casa en Alberdi con patio seco y terraza",
    location: "Alberdi, Rosario",
    property_type: "Casa",
    operation_type: "Venta",
    price: 142000,
    currency: "USD",
    surface_m2: 164,
    covered_surface_m2: 131,
    rooms: 4,
    bedrooms: 2,
    bathrooms: 2,
    garage_spaces: 1,
    description:
      "Casa de pasillo reciclada con patio seco, terraza utilizable y ambientes amplios. Muy buena opcion para vivienda permanente.",
    status: "published",
    featured: false,
    latitude: -32.9149,
    longitude: -60.6771,
    maps_url: "https://maps.google.com/?q=-32.9149,-60.6771",
    service_tags: ["Agua corriente", "Gas natural", "Cloaca", "Electricidad"],
    amenity_tags: ["Patio", "Terraza", "Parrillero"],
    imageUrls: [
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600047509358-9dc75507daeb?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=80",
    ],
  },
];

function sanitizeSlugName(slug, position, contentType) {
  const extensionFromType = contentType?.split("/")[1]?.split(";")[0];
  const extension =
    extensionFromType && /^[a-z0-9]+$/i.test(extensionFromType)
      ? extensionFromType
      : "jpg";

  return `${String(position + 1).padStart(2, "0")}.${extension}`;
}

async function uploadGallery(propertyId, imageUrls) {
  const { data: existingFiles } = await supabase.storage.from(bucket).list(propertyId, {
    limit: 100,
  });

  if (existingFiles?.length) {
    await supabase.storage
      .from(bucket)
      .remove(existingFiles.map((file) => `${propertyId}/${file.name}`));
  }

  const uploadedUrls = [];

  for (const [index, imageUrl] of imageUrls.entries()) {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`No se pudo descargar la imagen ${imageUrl}`);
    }

    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const fileName = sanitizeSlugName(propertyId, index, contentType);

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(`${propertyId}/${fileName}`, Buffer.from(arrayBuffer), {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrl } = supabase.storage
      .from(bucket)
      .getPublicUrl(`${propertyId}/${fileName}`);
    uploadedUrls.push(publicUrl.publicUrl);
  }

  return uploadedUrls;
}

for (const property of properties) {
  const { imageUrls, ...row } = property;

  const { data: savedProperty, error: propertyError } = await supabase
    .from("properties")
    .upsert(
      {
        ...row,
        cover_url: null,
      },
      {
        onConflict: "slug",
      },
    )
    .select("id")
    .single();

  if (propertyError || !savedProperty?.id) {
    throw propertyError ?? new Error(`No se pudo guardar ${property.slug}`);
  }

  const galleryUrls = await uploadGallery(savedProperty.id, imageUrls);

  const { error: coverError } = await supabase
    .from("properties")
    .update({ cover_url: galleryUrls[0] ?? null })
    .eq("id", savedProperty.id);

  if (coverError) {
    throw coverError;
  }

  console.log(`OK ${property.slug} -> ${savedProperty.id} (${galleryUrls.length} fotos)`);
}

console.log("Seed Rosario completado.");
