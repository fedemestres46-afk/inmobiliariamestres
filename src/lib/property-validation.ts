import {
  propertyAmenityOptions,
  propertyServiceOptions,
  type PropertyAmenity,
  type PropertyOperation,
  type PropertyService,
  type PropertyStatus,
  type PropertyType,
} from "@/data/properties";

const propertyTypes: PropertyType[] = [
  "Casa",
  "Departamento",
  "Lote",
  "Oficina",
  "Cochera",
  "Galpon",
];
const propertyOperations: PropertyOperation[] = ["Venta", "Alquiler"];
const propertyCurrencies = ["USD", "ARS"] as const;
const propertyStatuses: PropertyStatus[] = ["Publicada", "Borrador", "Pausada"];

export type PropertyWritePayload = {
  title: string;
  location: string;
  property_type: PropertyType;
  operation_type: PropertyOperation;
  price: number;
  currency: "USD" | "ARS";
  surface_m2: number;
  covered_surface_m2: number;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  garage_spaces: number;
  status: "published" | "draft" | "paused";
  featured: boolean;
  cover_url: string;
  description: string;
  service_tags: PropertyService[];
  amenity_tags: PropertyAmenity[];
  latitude?: number;
  longitude?: number;
  maps_url?: string;
};

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

type FieldValidation<T> =
  | { value: T }
  | { error: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseNumber(value: unknown) {
  return typeof value === "number" ? value : Number(value);
}

function parseNonNegativeInteger(value: unknown, label: string): FieldValidation<number> {
  const parsed = parseNumber(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return { error: `${label} debe ser un numero valido mayor o igual a 0.` };
  }

  return { value: Math.round(parsed) };
}

function parseEnumValue<T extends string>(
  value: unknown,
  validValues: readonly T[],
  label: string,
): FieldValidation<T> {
  if (typeof value !== "string" || !validValues.includes(value as T)) {
    return { error: `${label} no es valido.` };
  }

  return { value: value as T };
}

function parseBoolean(value: unknown) {
  return value === true;
}

function parseOptionalCoordinate(
  value: unknown,
  label: string,
  min: number,
  max: number,
): FieldValidation<number | undefined> {
  if (value === undefined || value === null || value === "") {
    return { value: undefined };
  }

  const parsed = parseNumber(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return { error: `${label} no es valida.` };
  }

  return { value: parsed };
}

function parseStringArray<T extends string>(
  value: unknown,
  validValues: readonly T[],
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => (typeof item === "string" ? item : ""))
        .filter((item): item is T => validValues.includes(item as T)),
    ),
  );
}

function toApiStatus(status: PropertyStatus) {
  switch (status) {
    case "Publicada":
      return "published" as const;
    case "Pausada":
      return "paused" as const;
    default:
      return "draft" as const;
  }
}

export function validatePropertyWritePayload(body: unknown): ValidationResult<PropertyWritePayload> {
  if (!isObject(body)) {
    return { success: false, error: "No se recibieron datos validos para la propiedad." };
  }

  const title = parseTrimmedString(body.title);
  if (title.length < 3) {
    return { success: false, error: "El titulo debe tener al menos 3 caracteres." };
  }

  const location = parseTrimmedString(body.location);
  if (location.length < 3) {
    return { success: false, error: "La ubicacion debe tener al menos 3 caracteres." };
  }

  const propertyType = parseEnumValue(body.property_type, propertyTypes, "El tipo");
  if ("error" in propertyType) {
    return { success: false, error: propertyType.error };
  }

  const operationType = parseEnumValue(
    body.operation_type,
    propertyOperations,
    "La operacion",
  );
  if ("error" in operationType) {
    return { success: false, error: operationType.error };
  }

  const currency = parseEnumValue(body.currency, propertyCurrencies, "La moneda");
  if ("error" in currency) {
    return { success: false, error: currency.error };
  }

  const uiStatus = parseEnumValue(body.status, propertyStatuses, "El estado");
  if ("error" in uiStatus) {
    return { success: false, error: uiStatus.error };
  }

  const price = parseNonNegativeInteger(body.price, "El precio");
  if ("error" in price) {
    return { success: false, error: price.error };
  }

  const surface = parseNonNegativeInteger(body.surface_m2, "Los m2 totales");
  if ("error" in surface) {
    return { success: false, error: surface.error };
  }

  const coveredSurface = parseNonNegativeInteger(
    body.covered_surface_m2,
    "Los m2 cubiertos",
  );
  if ("error" in coveredSurface) {
    return { success: false, error: coveredSurface.error };
  }

  const rooms = parseNonNegativeInteger(body.rooms, "Los ambientes");
  if ("error" in rooms) {
    return { success: false, error: rooms.error };
  }

  const bedrooms = parseNonNegativeInteger(body.bedrooms, "Los dormitorios");
  if ("error" in bedrooms) {
    return { success: false, error: bedrooms.error };
  }

  const bathrooms = parseNonNegativeInteger(body.bathrooms, "Los baños");
  if ("error" in bathrooms) {
    return { success: false, error: bathrooms.error };
  }

  const garageSpaces = parseNonNegativeInteger(body.garage_spaces, "Las cocheras");
  if ("error" in garageSpaces) {
    return { success: false, error: garageSpaces.error };
  }

  const coverUrl = parseTrimmedString(body.cover_url);
  if (coverUrl.length < 10) {
    return { success: false, error: "La URL de portada no es valida." };
  }

  const description = parseTrimmedString(body.description);
  if (description.length < 8) {
    return { success: false, error: "La descripcion debe tener al menos 8 caracteres." };
  }

  const latitude = parseOptionalCoordinate(body.latitude, "La latitud", -90, 90);
  if ("error" in latitude) {
    return { success: false, error: latitude.error };
  }

  const longitude = parseOptionalCoordinate(body.longitude, "La longitud", -180, 180);
  if ("error" in longitude) {
    return { success: false, error: longitude.error };
  }

  const mapsUrl = parseTrimmedString(body.maps_url);

  return {
    success: true,
    data: {
      title,
      location,
      property_type: propertyType.value,
      operation_type: operationType.value,
      price: price.value,
      currency: currency.value,
      surface_m2: surface.value,
      covered_surface_m2: coveredSurface.value,
      rooms: rooms.value,
      bedrooms: bedrooms.value,
      bathrooms: bathrooms.value,
      garage_spaces: garageSpaces.value,
      status: toApiStatus(uiStatus.value),
      featured: parseBoolean(body.featured),
      cover_url: coverUrl,
      description,
      service_tags: parseStringArray(body.service_tags, propertyServiceOptions),
      amenity_tags: parseStringArray(body.amenity_tags, propertyAmenityOptions),
      ...(latitude.value !== undefined ? { latitude: latitude.value } : {}),
      ...(longitude.value !== undefined ? { longitude: longitude.value } : {}),
      ...(mapsUrl ? { maps_url: mapsUrl } : {}),
    },
  };
}
