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
  {
    id: "55555555-5555-5555-5555-555555555555",
    slug: "departamento-ovidio-lagos-macrocentro",
    title: "Departamento moderno con balcon aterrazado",
    location: "Macrocentro, Rosario",
    property_type: "Departamento",
    operation_type: "Venta",
    price: 128000,
    currency: "USD",
    surface_m2: 94,
    covered_surface_m2: 82,
    rooms: 4,
    bedrooms: 2,
    bathrooms: 2,
    garage_spaces: 1,
    featured: true,
    status: "published",
    cover_url:
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
    description:
      "Departamento de dos dormitorios con balcon aterrazado, cocina integrada y cochera. Muy buena luz natural y excelente conectividad.",
    latitude: -32.9583,
    longitude: -60.6459,
    maps_url: "https://maps.google.com/?q=-32.9583,-60.6459",
    service_tags: ["Agua corriente", "Gas natural", "Cloaca", "Electricidad"],
    amenity_tags: ["Aire acondicionado individual", "Balcon", "Lavadero"],
  },
  {
    id: "66666666-6666-6666-6666-666666666666",
    slug: "casa-jardin-azcuenaga-rosario",
    title: "Casa de tres dormitorios con jardin y parrillero",
    location: "Azcuenaga, Rosario",
    property_type: "Casa",
    operation_type: "Venta",
    price: 176000,
    currency: "USD",
    surface_m2: 232,
    covered_surface_m2: 168,
    rooms: 5,
    bedrooms: 3,
    bathrooms: 2,
    garage_spaces: 2,
    featured: false,
    status: "published",
    cover_url:
      "https://images.unsplash.com/photo-1576941089067-2de3c901e126?auto=format&fit=crop&w=1200&q=80",
    description:
      "Casa funcional con jardin al fondo, parrillero techado y doble cochera. Ideal para familia que busca espacio y comodidad.",
    latitude: -32.9367,
    longitude: -60.7052,
    maps_url: "https://maps.google.com/?q=-32.9367,-60.7052",
    service_tags: ["Agua corriente", "Gas natural", "Cloaca", "Electricidad"],
    amenity_tags: ["Patio", "Parrillero", "Lavadero", "Calefaccion"],
  },
  {
    id: "77777777-7777-7777-7777-777777777777",
    slug: "oficina-pellegrini-oroño-rosario",
    title: "Oficina premium con recepcion y privado",
    location: "Pellegrini y Oroño, Rosario",
    property_type: "Oficina",
    operation_type: "Alquiler",
    price: 980000,
    currency: "ARS",
    surface_m2: 78,
    covered_surface_m2: 78,
    rooms: 3,
    bedrooms: 0,
    bathrooms: 1,
    garage_spaces: 0,
    featured: false,
    status: "published",
    cover_url:
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80",
    description:
      "Oficina lista para uso profesional con recepcion, privado y sala de reuniones. Muy buena imagen corporativa.",
    latitude: -32.9519,
    longitude: -60.6507,
    maps_url: "https://maps.google.com/?q=-32.9519,-60.6507",
    service_tags: ["Agua corriente", "Electricidad"],
    amenity_tags: ["Aire acondicionado individual", "Calefaccion", "Seguridad"],
  },
  {
    id: "88888888-8888-8888-8888-888888888888",
    slug: "galpon-logistico-zona-sudoeste",
    title: "Galpon logistico con ingreso para camiones",
    location: "Zona Sudoeste, Rosario",
    property_type: "Galpon",
    operation_type: "Venta",
    price: 265000,
    currency: "USD",
    surface_m2: 480,
    covered_surface_m2: 430,
    rooms: 2,
    bedrooms: 0,
    bathrooms: 2,
    garage_spaces: 4,
    featured: false,
    status: "published",
    cover_url:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
    description:
      "Galpon con oficinas, vestuarios y playa de maniobras. Muy buena opcion para logistica liviana o distribucion.",
    latitude: -32.9864,
    longitude: -60.6955,
    maps_url: "https://maps.google.com/?q=-32.9864,-60.6955",
    service_tags: ["Agua corriente", "Electricidad", "Cloaca"],
    amenity_tags: ["Seguridad"],
  },
  {
    id: "99999999-9999-9999-9999-999999999999",
    slug: "cochera-microcentro-cordoba-rosario",
    title: "Cochera fija en microcentro con acceso 24 hs",
    location: "Microcentro, Rosario",
    property_type: "Cochera",
    operation_type: "Venta",
    price: 18500,
    currency: "USD",
    surface_m2: 14,
    covered_surface_m2: 14,
    rooms: 0,
    bedrooms: 0,
    bathrooms: 0,
    garage_spaces: 1,
    featured: false,
    status: "published",
    cover_url:
      "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80",
    description:
      "Cochera fija de facil acceso en pleno microcentro. Ideal para uso propio o renta inmediata.",
    latitude: -32.9452,
    longitude: -60.6398,
    maps_url: "https://maps.google.com/?q=-32.9452,-60.6398",
    service_tags: ["Electricidad"],
    amenity_tags: ["Seguridad"],
  },
];

const mockGalleries: Record<string, string[]> = {
  "11111111-1111-1111-1111-111111111111": [
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=80",
  ],
  "22222222-2222-2222-2222-222222222222": [
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=1200&q=80",
  ],
  "55555555-5555-5555-5555-555555555555": [
    "https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1502005097973-6a7082348e28?auto=format&fit=crop&w=1200&q=80",
  ],
  "66666666-6666-6666-6666-666666666666": [
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1200&q=80",
  ],
  "77777777-7777-7777-7777-777777777777": [
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1497366412874-3415097a27e7?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
  ],
  "88888888-8888-8888-8888-888888888888": [
    "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80",
  ],
  "99999999-9999-9999-9999-999999999999": [
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
  ],
};

export const properties = mockRows.map((row) =>
  mapPropertyRow(row, mockGalleries[row.id] ?? []),
);
