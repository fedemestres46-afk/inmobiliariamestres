export type PropertyType =
  | "Casa"
  | "Departamento"
  | "Lote"
  | "Oficina"
  | "Cochera"
  | "Galpon";
export type PropertyOperation = "Venta" | "Alquiler";
export type PropertyStatus = "Publicada" | "Borrador" | "Pausada";

export const propertyServiceOptions = [
  "Agua corriente",
  "Gas natural",
  "Cloaca",
  "Electricidad",
] as const;

export const propertyAmenityOptions = [
  "Aire acondicionado individual",
  "Calefaccion",
  "Patio",
  "Balcon",
  "Terraza",
  "Parrillero",
  "Pileta",
  "Lavadero",
  "Seguridad",
] as const;

export type PropertyService = (typeof propertyServiceOptions)[number];
export type PropertyAmenity = (typeof propertyAmenityOptions)[number];

export type Property = {
  id: string;
  slug: string;
  title: string;
  location: string;
  locationLabel: string;
  type: PropertyType;
  operation: PropertyOperation;
  price: string;
  numericPrice: number;
  currency: "USD" | "ARS";
  surface: string;
  surfaceM2: number;
  coveredSurfaceM2: number;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  garageSpaces: number;
  featured?: boolean;
  status: PropertyStatus;
  cover: string;
  gallery: string[];
  latitude?: number;
  longitude?: number;
  mapsUrl?: string;
  description?: string;
  services: PropertyService[];
  amenities: PropertyAmenity[];
  updatedAt?: string;
  lastEditedByEmail?: string;
};

export type PropertyRow = {
  id: string;
  slug: string;
  title: string;
  location: string;
  property_type: PropertyType;
  operation_type: PropertyOperation;
  price: number;
  currency: "USD" | "ARS";
  surface_m2: number;
  covered_surface_m2?: number | null;
  rooms?: number | null;
  bedrooms: number;
  bathrooms?: number | null;
  garage_spaces?: number | null;
  status: "published" | "draft" | "paused";
  featured: boolean;
  cover_url: string | null;
  description: string | null;
  latitude?: number | null;
  longitude?: number | null;
  maps_url?: string | null;
  service_tags?: string[] | null;
  amenity_tags?: string[] | null;
  updated_at?: string | null;
  last_edited_by_email?: string | null;
  last_edited_by_user_id?: string | null;
};

function isValidLatitude(value: number) {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value: number) {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

function formatPrice(price: number, currency: "USD" | "ARS") {
  const locale = "es-AR";
  const formatted = new Intl.NumberFormat(locale).format(price);
  return currency === "USD" ? `USD ${formatted}` : `AR$ ${formatted}`;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return undefined;
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function mapStatus(status: PropertyRow["status"]): PropertyStatus {
  if (status === "published") {
    return "Publicada";
  }

  if (status === "paused") {
    return "Pausada";
  }

  return "Borrador";
}

export function extractCoordinatesFromMapsUrl(mapsUrl?: string | null) {
  if (!mapsUrl) {
    return {};
  }

  const patterns = [
    /[?&]q=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i,
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i,
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/i,
  ];

  for (const pattern of patterns) {
    const match = mapsUrl.match(pattern);
    if (!match) {
      continue;
    }

    const latitude = Number(match[1]);
    const longitude = Number(match[2]);

    if (isValidLatitude(latitude) && isValidLongitude(longitude)) {
      return { latitude, longitude };
    }
  }

  return {};
}

export function mapPropertyRow(row: PropertyRow, gallery: string[] = []): Property {
  const cover =
    row.cover_url ??
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80";
  const mergedGallery = Array.from(new Set([cover, ...gallery]));
  const fallbackCoordinates = extractCoordinatesFromMapsUrl(row.maps_url);
  const safeLatitude = isValidLatitude(row.latitude ?? NaN)
    ? (row.latitude ?? undefined)
    : fallbackCoordinates.latitude;
  const safeLongitude = isValidLongitude(row.longitude ?? NaN)
    ? (row.longitude ?? undefined)
    : fallbackCoordinates.longitude;
  const services = (row.service_tags ?? []).filter((item): item is PropertyService =>
    propertyServiceOptions.includes(item as PropertyService),
  );
  const amenities = (row.amenity_tags ?? []).filter((item): item is PropertyAmenity =>
    propertyAmenityOptions.includes(item as PropertyAmenity),
  );

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    location: row.location,
    locationLabel: row.location,
    type: row.property_type,
    operation: row.operation_type,
    price: formatPrice(row.price, row.currency),
    numericPrice: row.price,
    currency: row.currency,
    surface: `${row.surface_m2} m2`,
    surfaceM2: row.surface_m2,
    coveredSurfaceM2: row.covered_surface_m2 ?? row.surface_m2,
    rooms: row.rooms ?? row.bedrooms,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms ?? 0,
    garageSpaces: row.garage_spaces ?? 0,
    featured: row.featured,
    status: mapStatus(row.status),
    cover,
    gallery: mergedGallery,
    latitude: safeLatitude,
    longitude: safeLongitude,
    mapsUrl: row.maps_url ?? undefined,
    description: row.description ?? undefined,
    services,
    amenities,
    updatedAt: formatDateTime(row.updated_at),
    lastEditedByEmail: row.last_edited_by_email ?? undefined,
  };
}

const mockRows: PropertyRow[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    slug: "casa-rioja-pellegrini",
    title: "Casa reciclada con patio y pileta",
    location: "Pichincha, Rosario",
    property_type: "Casa",
    operation_type: "Venta",
    price: 248000,
    currency: "USD",
    surface_m2: 214,
    covered_surface_m2: 186,
    rooms: 6,
    bedrooms: 3,
    bathrooms: 2,
    garage_spaces: 1,
    featured: true,
    status: "published",
    cover_url:
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80",
    description:
      "Casa reciclada con tres dormitorios, patio verde y pileta. Ideal para familia.",
    latitude: -33.0442,
    longitude: -61.1681,
    maps_url: "https://maps.google.com/?q=-33.0442,-61.1681",
    service_tags: ["Agua corriente", "Gas natural", "Cloaca", "Electricidad"],
    amenity_tags: ["Aire acondicionado individual", "Patio", "Pileta", "Parrillero"],
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    slug: "departamento-premium-parque-espana",
    title: "Semipiso premium frente al rio",
    location: "Parque Espana, Rosario",
    property_type: "Departamento",
    operation_type: "Venta",
    price: 189000,
    currency: "USD",
    surface_m2: 128,
    covered_surface_m2: 118,
    rooms: 4,
    bedrooms: 2,
    bathrooms: 2,
    garage_spaces: 1,
    featured: true,
    status: "published",
    cover_url:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
    description:
      "Semipiso luminoso con visuales abiertas, balcon corrido y terminaciones premium.",
    latitude: -33.0465,
    longitude: -61.1672,
    maps_url: "https://maps.google.com/?q=-33.0465,-61.1672",
    service_tags: ["Agua corriente", "Gas natural", "Cloaca", "Electricidad"],
    amenity_tags: ["Aire acondicionado individual", "Balcon", "Calefaccion", "Seguridad"],
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    slug: "oficina-corporativa-centro",
    title: "Oficina corporativa con sala de reuniones",
    location: "Centro, Rosario",
    property_type: "Oficina",
    operation_type: "Alquiler",
    price: 1150000,
    currency: "ARS",
    surface_m2: 96,
    covered_surface_m2: 96,
    rooms: 3,
    bedrooms: 0,
    bathrooms: 1,
    garage_spaces: 0,
    featured: false,
    status: "draft",
    cover_url:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
    description:
      "Planta flexible para equipos comerciales o estudios profesionales.",
    latitude: -33.0408,
    longitude: -61.1656,
    maps_url: "https://maps.google.com/?q=-33.0408,-61.1656",
    service_tags: ["Agua corriente", "Electricidad"],
    amenity_tags: ["Aire acondicionado individual", "Calefaccion"],
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    slug: "lote-barrio-abierto-funes",
    title: "Lote en barrio abierto listo para construir",
    location: "Funes, Santa Fe",
    property_type: "Lote",
    operation_type: "Venta",
    price: 64000,
    currency: "USD",
    surface_m2: 540,
    covered_surface_m2: 0,
    rooms: 0,
    bedrooms: 0,
    bathrooms: 0,
    garage_spaces: 0,
    featured: false,
    status: "paused",
    cover_url:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
    description:
      "Lote regular con servicios y excelente acceso desde autopista.",
    latitude: -33.0514,
    longitude: -61.1731,
    maps_url: "https://maps.google.com/?q=-33.0514,-61.1731",
    service_tags: ["Agua corriente", "Electricidad"],
    amenity_tags: [],
  },
];

export const properties = mockRows.map((row) => mapPropertyRow(row));
