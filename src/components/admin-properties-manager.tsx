"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import type {
  Property,
  PropertyOperation,
  PropertyStatus,
  PropertyType,
} from "@/data/properties";
import { extractCoordinatesFromMapsUrl } from "@/data/properties";

type SaveState = {
  type: "idle" | "success" | "error";
  message: string;
};

type Props = {
  initialProperties: Property[];
  canPersist: boolean;
};

const typeOptions: PropertyType[] = [
  "Casa",
  "Departamento",
  "Lote",
  "Oficina",
];
const operationOptions: PropertyOperation[] = ["Venta", "Alquiler"];
const statusOptions: PropertyStatus[] = ["Publicada", "Borrador", "Pausada"];

function getStatusBadgeClasses(status: PropertyStatus) {
  if (status === "Publicada") {
    return "bg-[#e6f5ea] text-[#39704a]";
  }

  if (status === "Pausada") {
    return "bg-[#fdeceb] text-[#b04c47]";
  }

  return "bg-[#fff1df] text-[#b46f24]";
}

function toApiStatus(status: PropertyStatus) {
  if (status === "Publicada") {
    return "published";
  }

  if (status === "Pausada") {
    return "paused";
  }

  return "draft";
}

function formatPrice(value: number, currency: "USD" | "ARS") {
  const formatted = new Intl.NumberFormat("es-AR").format(value);
  return currency === "USD" ? `USD ${formatted}` : `AR$ ${formatted}`;
}

function parseOptionalCoordinate(value: FormDataEntryValue | null) {
  const raw = String(value ?? "")
    .trim()
    .replace(/\s+/g, "")
    .replace(",", ".");
  if (raw === "") {
    return undefined;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isValidLatitude(value?: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value?: number) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= -180 &&
    value <= 180
  );
}

export function AdminPropertiesManager({
  initialProperties,
  canPersist,
}: Props) {
  const [properties, setProperties] = useState(initialProperties);
  const [selectedId, setSelectedId] = useState(initialProperties[0]?.id ?? "");
  const [statusFilter, setStatusFilter] = useState<PropertyStatus | "Todas">("Todas");
  const [saveState, setSaveState] = useState<SaveState>({
    type: "idle",
    message: "",
  });
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [deletingImageUrl, setDeletingImageUrl] = useState<string | null>(null);
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totals = useMemo(
    () => ({
      published: properties.filter((property) => property.status === "Publicada")
        .length,
      drafts: properties.filter((property) => property.status === "Borrador")
        .length,
      paused: properties.filter((property) => property.status === "Pausada")
        .length,
    }),
    [properties],
  );

  const filteredProperties = useMemo(() => {
    if (statusFilter === "Todas") {
      return properties;
    }

    return properties.filter((property) => property.status === statusFilter);
  }, [properties, statusFilter]);

  const selectedProperty =
    filteredProperties.find((property) => property.id === selectedId) ??
    filteredProperties[0];

  async function handleSubmit(formData: FormData) {
    if (!selectedProperty) {
      return;
    }

    const mapsUrlRaw = String(formData.get("maps_url") ?? "").trim();
    const latitudeRaw = parseOptionalCoordinate(formData.get("latitude"));
    const longitudeRaw = parseOptionalCoordinate(formData.get("longitude"));
    const extractedCoordinates = extractCoordinatesFromMapsUrl(mapsUrlRaw);
    const safeLatitude = isValidLatitude(latitudeRaw)
      ? latitudeRaw
      : extractedCoordinates.latitude;
    const safeLongitude = isValidLongitude(longitudeRaw)
      ? longitudeRaw
      : extractedCoordinates.longitude;

    const payload = {
      title: String(formData.get("title") ?? ""),
      location: String(formData.get("location") ?? ""),
      property_type: String(formData.get("property_type") ?? "") as PropertyType,
      operation_type: String(
        formData.get("operation_type") ?? "",
      ) as PropertyOperation,
      price: Number(formData.get("price") ?? 0),
      currency: String(formData.get("currency") ?? "USD") as "USD" | "ARS",
      surface_m2: Number(formData.get("surface_m2") ?? 0),
      covered_surface_m2: Number(formData.get("covered_surface_m2") ?? 0),
      rooms: Number(formData.get("rooms") ?? 0),
      bedrooms: Number(formData.get("bedrooms") ?? 0),
      bathrooms: Number(formData.get("bathrooms") ?? 0),
      garage_spaces: Number(formData.get("garage_spaces") ?? 0),
      status: toApiStatus(
        String(formData.get("status") ?? "Borrador") as PropertyStatus,
      ),
      featured: formData.get("featured") === "on",
      cover_url: String(formData.get("cover_url") ?? ""),
      description: String(formData.get("description") ?? ""),
      latitude: safeLatitude,
      longitude: safeLongitude,
      maps_url: mapsUrlRaw === "" ? undefined : mapsUrlRaw,
    };

    startTransition(async () => {
      const response = await fetch(`/api/admin/properties/${selectedProperty.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as
        | { property?: Property; error?: string }
        | undefined;

      if (!response.ok || !result?.property) {
        setSaveState({
          type: "error",
          message:
            result?.error ??
            "No se pudo guardar. Revisemos la configuracion del backend.",
        });
        return;
      }

      setProperties((current) =>
        current.map((property) =>
          property.id === result.property?.id ? result.property : property,
        ),
      );
      setSaveState({
        type: "success",
        message: "Cambios guardados correctamente.",
      });
    });
  }

  function handleCreateProperty() {
    startTransition(async () => {
      const response = await fetch("/api/admin/properties", {
        method: "POST",
      });

      const result = (await response.json()) as
        | { property?: Property; error?: string }
        | undefined;

      if (!response.ok || !result?.property) {
        setSaveState({
          type: "error",
          message:
            result?.error ??
            "No se pudo crear la propiedad nueva en este momento.",
        });
        return;
      }

      setProperties((current) => [result.property!, ...current]);
      setSelectedId(result.property.id);
      setSaveState({
        type: "success",
        message: "Nueva propiedad creada. Ya podes completar sus datos.",
      });
    });
  }

  async function handleCoverUpload(files: File[]) {
    if (!selectedProperty) {
      return;
    }

    const payload = new FormData();
    for (const file of files) {
      payload.append("files", file);
    }

    setIsUploading(true);
    setSaveState({ type: "idle", message: "" });

    try {
      const response = await fetch(
        `/api/admin/properties/${selectedProperty.id}/cover`,
        {
          method: "POST",
          body: payload,
        },
      );

      const result = (await response.json()) as
        | { property?: Property; error?: string }
        | undefined;

      if (!response.ok || !result?.property) {
        setSaveState({
          type: "error",
          message:
            result?.error ?? "No se pudo subir la imagen de portada.",
        });
        return;
      }

      setProperties((current) =>
        current.map((property) =>
          property.id === result.property?.id ? result.property : property,
        ),
      );
      setSaveState({
        type: "success",
        message: "Imagen subida y portada actualizada.",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleDeleteImage(imageUrl: string) {
    if (!selectedProperty) {
      return;
    }

    setDeletingImageUrl(imageUrl);
    setSaveState({ type: "idle", message: "" });

    try {
      const response = await fetch(
        `/api/admin/properties/${selectedProperty.id}/cover`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl }),
        },
      );

      const result = (await response.json()) as
        | { property?: Property; error?: string }
        | undefined;

      if (!response.ok || !result?.property) {
        setSaveState({
          type: "error",
          message: result?.error ?? "No se pudo borrar la imagen.",
        });
        return;
      }

      setProperties((current) =>
        current.map((property) =>
          property.id === result.property?.id ? result.property : property,
        ),
      );
      setSaveState({
        type: "success",
        message: "Imagen borrada correctamente.",
      });
    } finally {
      setDeletingImageUrl(null);
    }
  }

  async function handleDeleteProperty(propertyId: string) {
    setDeletingPropertyId(propertyId);
    setSaveState({ type: "idle", message: "" });

    try {
      const response = await fetch(`/api/admin/properties/${propertyId}`, {
        method: "DELETE",
      });

      const result = (await response.json()) as
        | { success?: boolean; id?: string; error?: string }
        | undefined;

      if (!response.ok || !result?.success || !result.id) {
        setSaveState({
          type: "error",
          message: result?.error ?? "No se pudo borrar la propiedad.",
        });
        return;
      }

      setProperties((current) => {
        const nextProperties = current.filter((property) => property.id !== result.id);

        setSelectedId((currentSelectedId) => {
          if (currentSelectedId !== result.id) {
            return currentSelectedId;
          }

          return nextProperties[0]?.id ?? "";
        });

        return nextProperties;
      });
      setSaveState({
        type: "success",
        message: "Propiedad borrada correctamente.",
      });
    } finally {
      setDeletingPropertyId(null);
    }
  }

  const hasProperties = properties.length > 0;
  const hasFilteredProperties = filteredProperties.length > 0;

  return (
    <>
      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          {
            label: "Publicadas",
            value: totals.published,
            status: "Publicada" as PropertyStatus,
            accent: "text-[#39704a]",
            border: "border-[#cfe6d6]",
            bg: "bg-[#f3fbf5]",
          },
          {
            label: "Borradores",
            value: totals.drafts,
            status: "Borrador" as PropertyStatus,
            accent: "text-[#b46f24]",
            border: "border-[#edd8b8]",
            bg: "bg-[#fff8ef]",
          },
          {
            label: "Pausadas",
            value: totals.paused,
            status: "Pausada" as PropertyStatus,
            accent: "text-[#b04c47]",
            border: "border-[#ebcbc8]",
            bg: "bg-[#fff4f3]",
          },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              setStatusFilter((current) =>
                current === item.status ? "Todas" : item.status,
              );
              setSaveState({ type: "idle", message: "" });
            }}
            className={`rounded-[1.5rem] border px-6 py-5 text-left shadow-[0_18px_40px_rgba(35,43,50,0.06)] transition ${
              statusFilter === item.status
                ? `${item.border} ${item.bg}`
                : "border-white/80 bg-white hover:bg-[#faf6f0]"
            }`}
          >
            <p className={`text-sm uppercase tracking-[0.3em] ${item.accent}`}>
              {item.label}
            </p>
            <p className="mt-4 font-serif-display text-4xl">{item.value}</p>
          </button>
        ))}
      </section>

      <div className="mt-4 flex items-center justify-between gap-4 text-sm text-[#6a7379]">
        <p>
          {statusFilter === "Todas"
            ? "Mostrando todas las propiedades."
            : `Filtrando: ${statusFilter.toLowerCase()}.`}
        </p>
        {statusFilter !== "Todas" ? (
          <button
            type="button"
            onClick={() => setStatusFilter("Todas")}
            className="rounded-full border border-[#d7c7b6] px-4 py-2 text-[#5c666d] transition hover:bg-[#f7efe5]"
          >
            Ver todas
          </button>
        ) : null}
      </div>

      {!canPersist ? (
        <section className="mt-8 rounded-[1.5rem] border border-[#eed8c4] bg-[#fff7ef] px-6 py-5 text-sm leading-7 text-[#7c624b]">
          El formulario ya esta listo, pero para guardar de verdad falta cargar
          la variable `SUPABASE_SERVICE_ROLE_KEY` en el servidor. Con la clave
          publica podemos leer, pero no conviene editar datos reales.
        </section>
      ) : null}

      <section className="mt-10 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_24px_60px_rgba(35,43,50,0.07)]">
          <div className="flex items-center justify-between border-b border-[#ece4da] px-6 py-5">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[#7a838a]">
                Propiedades
              </p>
              <p className="mt-1 text-sm text-[#6a7379]">
                Selecciona una para editarla o crea una nueva.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCreateProperty}
              disabled={isPending || !canPersist}
              className="rounded-full bg-[#1f3b4d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#274b60] disabled:cursor-not-allowed disabled:bg-[#94a3ad]"
            >
              {isPending ? "Procesando..." : "Nueva propiedad"}
            </button>
          </div>

          <div className="grid grid-cols-[1.4fr_1fr_0.9fr_0.8fr] gap-4 border-b border-[#ece4da] px-6 py-4 text-sm uppercase tracking-[0.2em] text-[#7a838a]">
            <span>Propiedad</span>
            <span>Operacion</span>
            <span>Precio</span>
            <span>Estado</span>
          </div>

          <div className="divide-y divide-[#ece4da]">
            {filteredProperties.map((property) => (
              <div
                key={property.id}
                className={`grid grid-cols-1 gap-3 px-6 py-5 transition md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_auto] md:items-start ${
                  property.id === selectedProperty?.id
                    ? "bg-[#fcf8f3]"
                    : "hover:bg-[#faf6f0]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(property.id);
                    setSaveState({ type: "idle", message: "" });
                  }}
                  className="grid grid-cols-1 gap-4 text-left md:col-span-4 md:grid-cols-subgrid"
                >
                  <div>
                    <h2 className="text-xl font-semibold text-[#22313b]">
                      {property.title}
                    </h2>
                    <p className="mt-1 text-sm text-[#667178]">
                      {property.location}
                    </p>
                  </div>
                  <div className="text-sm text-[#42505a]">
                    <p>{property.operation}</p>
                    <p className="mt-1 text-[#7a838a]">{property.type}</p>
                  </div>
                <div className="text-sm text-[#42505a]">{property.price}</div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-sm ${getStatusBadgeClasses(property.status)}`}
                    >
                      {property.status}
                    </span>
                    {property.status === "Publicada" ? (
                      <Link
                        href={`/propiedades/${property.slug}`}
                        target="_blank"
                        className="text-xs font-medium text-[#1f3b4d] underline decoration-[#d7c7b6] underline-offset-4 transition hover:text-[#9f6b44]"
                        onClick={(event) => event.stopPropagation()}
                      >
                        Ver ficha
                      </Link>
                    ) : null}
                  </div>
                </div>
                </button>
                <div className="flex items-start justify-end">
                  <button
                    type="button"
                    aria-label={`Borrar ${property.title}`}
                    onClick={() => void handleDeleteProperty(property.id)}
                    disabled={!canPersist || deletingPropertyId === property.id}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d7c7b6] text-xl leading-none text-[#7d5840] transition hover:border-[#9f6b44] hover:bg-[#f7efe5] hover:text-[#9f6b44] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingPropertyId === property.id ? "..." : "-"}
                  </button>
                </div>
              </div>
            ))}
            {!hasProperties ? (
              <div className="px-6 py-8 text-sm text-[#6a7379]">
                Aun no hay propiedades. Crea una nueva desde este panel.
              </div>
            ) : null}
            {hasProperties && !hasFilteredProperties ? (
              <div className="px-6 py-8 text-sm text-[#6a7379]">
                No hay propiedades en esta seccion todavia.
              </div>
            ) : null}
          </div>
        </div>

        <form
          key={selectedProperty?.id ?? "empty"}
          action={handleSubmit}
          className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_24px_60px_rgba(35,43,50,0.07)]"
        >
          {!selectedProperty ? (
            <div className="flex min-h-[24rem] flex-col items-center justify-center text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-[#9f6b44]">
                Sin seleccion
              </p>
              <h2 className="mt-4 font-serif-display text-4xl text-[#22313b]">
                No hay propiedades para editar
              </h2>
              <p className="mt-4 max-w-md text-base leading-8 text-[#6a7379]">
                Cuando crees una nueva propiedad o selecciones una existente,
                los campos apareceran aqui.
              </p>
            </div>
          ) : (
            <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[#9f6b44]">
                Edicion
              </p>
              <h2 className="mt-3 font-serif-display text-4xl text-[#22313b]">
                {selectedProperty.title}
              </h2>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-sm ${getStatusBadgeClasses(selectedProperty.status)}`}
            >
              {selectedProperty.status}
            </span>
          </div>

          {selectedProperty.status === "Publicada" ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={`/propiedades/${selectedProperty.slug}`}
                target="_blank"
                className="rounded-full border border-[#d8cabd] px-5 py-3 text-sm font-semibold text-[#1f3b4d] transition hover:bg-[#f6efe7]"
              >
                Ver ficha publica
              </Link>
              <button
                type="button"
                onClick={() =>
                  navigator.clipboard.writeText(
                    `${window.location.origin}/propiedades/${selectedProperty.slug}`,
                  )
                }
                className="rounded-full border border-[#d8cabd] px-5 py-3 text-sm font-semibold text-[#1f3b4d] transition hover:bg-[#f6efe7]"
              >
                Copiar link
              </button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[#7a838a]">
              La ficha publica se habilita cuando la propiedad esta en estado
              publicada.
            </p>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-[#6a7379]">Titulo</span>
              <input
                name="title"
                defaultValue={selectedProperty.title}
                className="w-full rounded-2xl border border-[#e7ddd2] px-4 py-3 outline-none transition focus:border-[#9f6b44]"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-[#6a7379]">Ubicacion</span>
              <input
                name="location"
                defaultValue={selectedProperty.location}
                className="w-full rounded-2xl border border-[#e7ddd2] px-4 py-3 outline-none transition focus:border-[#9f6b44]"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-[#6a7379]">Tipo</span>
              <select
                name="property_type"
                defaultValue={selectedProperty.type}
                className="w-full rounded-2xl border border-[#e7ddd2] px-4 py-3 outline-none transition focus:border-[#9f6b44]"
              >
                {typeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm text-[#6a7379]">Operacion</span>
              <select
                name="operation_type"
                defaultValue={selectedProperty.operation}
                className="w-full rounded-2xl border border-[#e7ddd2] px-4 py-3 outline-none transition focus:border-[#9f6b44]"
              >
                {operationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm text-[#6a7379]">Precio</span>
              <input
                name="price"
                type="number"
                defaultValue={selectedProperty.numericPrice}
                className="w-full rounded-2xl border border-[#e7ddd2] px-4 py-3 outline-none transition focus:border-[#9f6b44]"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-[#6a7379]">Moneda</span>
              <select
                name="currency"
                defaultValue={selectedProperty.currency}
                className="w-full rounded-2xl border border-[#e7ddd2] px-4 py-3 outline-none transition focus:border-[#9f6b44]"
              >
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm text-[#6a7379]">Metros cuadrados (totales)</span>
              <input
                name="surface_m2"
                type="number"
                defaultValue={selectedProperty.surfaceM2}
                className="w-full rounded-2xl border border-[#e7ddd2] px-4 py-3 outline-none transition focus:border-[#9f6b44]"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-[#6a7379]">Metros cuadrados (cubiertos)</span>
              <input
                name="covered_surface_m2"
                type="number"
                defaultValue={selectedProperty.coveredSurfaceM2}
                className="w-full rounded-2xl border border-[#e7ddd2] px-4 py-3 outline-none transition focus:border-[#9f6b44]"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-[#6a7379]">Dormitorios</span>
              <input
                name="bedrooms"
                type="number"
                defaultValue={selectedProperty.bedrooms}
                className="w-full rounded-2xl border border-[#e7ddd2] px-4 py-3 outline-none transition focus:border-[#9f6b44]"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-[#6a7379]">Ambientes</span>
              <input
                name="rooms"
                type="number"
                defaultValue={selectedProperty.rooms}
                className="w-full rounded-2xl border border-[#e7ddd2] px-4 py-3 outline-none transition focus:border-[#9f6b44]"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-[#6a7379]">Baños</span>
              <input
                name="bathrooms"
                type="number"
                defaultValue={selectedProperty.bathrooms}
                className="w-full rounded-2xl border border-[#e7ddd2] px-4 py-3 outline-none transition focus:border-[#9f6b44]"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-[#6a7379]">Cocheras</span>
              <input
                name="garage_spaces"
                type="number"
                defaultValue={selectedProperty.garageSpaces}
                className="w-full rounded-2xl border border-[#e7ddd2] px-4 py-3 outline-none transition focus:border-[#9f6b44]"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-[#6a7379]">Latitud</span>
              <input
                name="latitude"
                type="number"
                step="any"
                defaultValue={selectedProperty.latitude ?? ""}
                className="w-full rounded-2xl border border-[#e7ddd2] px-4 py-3 outline-none transition focus:border-[#9f6b44]"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-[#6a7379]">Longitud</span>
              <input
                name="longitude"
                type="number"
                step="any"
                defaultValue={selectedProperty.longitude ?? ""}
                className="w-full rounded-2xl border border-[#e7ddd2] px-4 py-3 outline-none transition focus:border-[#9f6b44]"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-[#6a7379]">Estado</span>
              <select
                name="status"
                defaultValue={selectedProperty.status}
                className="w-full rounded-2xl border border-[#e7ddd2] px-4 py-3 outline-none transition focus:border-[#9f6b44]"
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-[#e7ddd2] px-4 py-3 md:mt-7">
              <input
                name="featured"
                type="checkbox"
                defaultChecked={selectedProperty.featured}
              />
              <span className="text-sm text-[#6a7379]">Destacada</span>
            </label>
          </div>

          <div className="mt-4 space-y-3">
            <span className="block text-sm text-[#6a7379]">Imagen de portada</span>
            <div className="overflow-hidden rounded-[1.5rem] border border-[#e7ddd2]">
              <div className="relative aspect-[16/10] bg-[#f4ede5]">
                <Image
                  src={selectedProperty.cover}
                  alt={selectedProperty.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1280px) 100vw, 40vw"
                />
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                className="hidden"
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  if (files.length > 0) {
                    void handleCoverUpload(files);
                  }
                }}
                multiple
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || !canPersist}
                className="rounded-full border border-[#d8cabd] px-5 py-3 text-sm font-semibold text-[#1f3b4d] transition hover:bg-[#f6efe7] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUploading ? "Subiendo imagenes..." : "Subir imagenes"}
              </button>
              <p className="text-sm text-[#6a7379]">
                Puedes seleccionar varias. JPG, PNG, WebP o AVIF hasta 5 MB.
              </p>
            </div>
            {selectedProperty.gallery.length > 0 ? (
              <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
                {selectedProperty.gallery.map((imageUrl) => (
                  <div key={imageUrl} className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        const payload = {
                          title: selectedProperty.title,
                          location: selectedProperty.location,
                          property_type: selectedProperty.type,
                          operation_type: selectedProperty.operation,
                          price: selectedProperty.numericPrice,
                          currency: selectedProperty.currency,
                          surface_m2: selectedProperty.surfaceM2,
                          covered_surface_m2: selectedProperty.coveredSurfaceM2,
                          rooms: selectedProperty.rooms,
                          bedrooms: selectedProperty.bedrooms,
                          bathrooms: selectedProperty.bathrooms,
                          garage_spaces: selectedProperty.garageSpaces,
                          status: toApiStatus(selectedProperty.status),
                          featured: selectedProperty.featured ?? false,
                          cover_url: imageUrl,
                          description: selectedProperty.description ?? "",
                          latitude: selectedProperty.latitude,
                          longitude: selectedProperty.longitude,
                          maps_url: selectedProperty.mapsUrl,
                        };

                        startTransition(async () => {
                          const response = await fetch(
                            `/api/admin/properties/${selectedProperty.id}`,
                            {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(payload),
                            },
                          );
                          const result = (await response.json()) as
                            | { property?: Property; error?: string }
                            | undefined;

                          if (!response.ok || !result?.property) {
                            setSaveState({
                              type: "error",
                              message:
                                result?.error ??
                                "No se pudo cambiar la portada.",
                            });
                            return;
                          }

                          setProperties((current) =>
                            current.map((property) =>
                              property.id === result.property?.id
                                ? result.property
                                : property,
                            ),
                          );
                          setSaveState({
                            type: "success",
                            message: "Portada actualizada desde la galeria.",
                          });
                        });
                      }}
                      className={`block w-full overflow-hidden rounded-2xl border ${
                        imageUrl === selectedProperty.cover
                          ? "border-[#9f6b44]"
                          : "border-[#e7ddd2]"
                      }`}
                    >
                      <div className="relative aspect-square bg-[#f4ede5]">
                        <Image
                          src={imageUrl}
                          alt={selectedProperty.title}
                          fill
                          className="object-cover"
                          sizes="200px"
                        />
                      </div>
                    </button>
                    <button
                      type="button"
                      aria-label="Borrar imagen"
                      onClick={() => void handleDeleteImage(imageUrl)}
                      disabled={deletingImageUrl === imageUrl || !canPersist}
                      className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(31,59,77,0.92)] text-lg leading-none text-white shadow-[0_8px_18px_rgba(35,43,50,0.25)] transition hover:bg-[#9f6b44] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingImageUrl === imageUrl ? "…" : "×"}
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <label className="block space-y-2">
              <span className="text-sm text-[#6a7379]">
                URL de Google Maps
              </span>
              <input
                name="maps_url"
                defaultValue={selectedProperty.mapsUrl ?? ""}
                className="w-full rounded-2xl border border-[#e7ddd2] px-4 py-3 outline-none transition focus:border-[#9f6b44]"
              />
              <p className="text-xs leading-6 text-[#8b7d70]">
                Si pegas un link compartido con pin real, el sistema intenta
                completar la ubicacion exacta automaticamente. Si quieres maxima
                precision, puedes cargar tambien latitud y longitud manualmente.
              </p>
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-[#6a7379]">
                O pega una URL manualmente
              </span>
              <input
                name="cover_url"
                defaultValue={selectedProperty.cover}
                className="w-full rounded-2xl border border-[#e7ddd2] px-4 py-3 outline-none transition focus:border-[#9f6b44]"
              />
            </label>
          </div>

          <label className="mt-4 block space-y-2">
            <span className="text-sm text-[#6a7379]">Descripcion</span>
            <textarea
              name="description"
              defaultValue={selectedProperty.description}
              rows={5}
              className="w-full rounded-2xl border border-[#e7ddd2] px-4 py-3 outline-none transition focus:border-[#9f6b44]"
            />
          </label>

          <div className="mt-6 flex items-center justify-between gap-4">
            <p
              className={`text-sm ${
                saveState.type === "error"
                  ? "text-[#a04d39]"
                  : saveState.type === "success"
                    ? "text-[#39704a]"
                    : "text-[#6a7379]"
              }`}
            >
              {saveState.message ||
                `Precio actual: ${formatPrice(
                  selectedProperty.numericPrice,
                  selectedProperty.currency,
                )}`}
            </p>
            <button
              type="submit"
              disabled={isPending || !canPersist}
              className="rounded-full bg-[#1f3b4d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#274b60] disabled:cursor-not-allowed disabled:bg-[#94a3ad]"
            >
              {isPending ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
            </>
          )}
        </form>
      </section>
    </>
  );
}
