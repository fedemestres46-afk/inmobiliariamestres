"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { Lead } from "@/data/leads";
import type { Property, PropertyOperation, PropertyType } from "@/data/properties";
import { PropertiesLiveMap } from "@/components/properties-live-map";

type Props = {
  properties: Property[];
};

type ViewMode = "grid" | "map";
type SortOption =
  | "default"
  | "price-asc"
  | "price-desc"
  | "surface-desc"
  | "surface-asc"
  | "bedrooms-asc";

const propertyTypeOptions: Array<PropertyType | "Todos"> = [
  "Todos",
  "Casa",
  "Departamento",
  "Lote",
  "Oficina",
  "Cochera",
  "Galpon",
];

const operationOptions: Array<PropertyOperation | "Todas"> = [
  "Todas",
  "Venta",
  "Alquiler",
];

const currencyOptions: Array<Property["currency"] | "Todas"> = [
  "Todas",
  "USD",
  "ARS",
];

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: "default", label: "Destacadas primero" },
  { value: "price-asc", label: "Menor precio" },
  { value: "price-desc", label: "Mayor precio" },
  { value: "surface-desc", label: "Mayor m2" },
  { value: "surface-asc", label: "Menor m2" },
  { value: "bedrooms-asc", label: "Ambientes: menor a mayor" },
];

type InquiryState = {
  type: "idle" | "success" | "error";
  message: string;
};

export function PropertiesExplorer({ properties }: Props) {
  const [typeFilter, setTypeFilter] = useState<PropertyType | "Todos">("Todos");
  const [operationFilter, setOperationFilter] = useState<
    PropertyOperation | "Todas"
  >("Todas");
  const [currencyFilter, setCurrencyFilter] = useState<Property["currency"] | "Todas">(
    "Todas",
  );
  const [locationFilter, setLocationFilter] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("default");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [leadPropertyId, setLeadPropertyId] = useState<string | null>(null);
  const [inquiryState, setInquiryState] = useState<InquiryState>({
    type: "idle",
    message: "",
  });
  const [isSubmittingLead, startLeadTransition] = useTransition();

  const filteredProperties = useMemo(() => {
    const nextProperties = properties.filter((property) => {
      const matchesType =
        typeFilter === "Todos" ? true : property.type === typeFilter;
      const matchesOperation =
        operationFilter === "Todas"
          ? true
          : property.operation === operationFilter;
      const matchesCurrency =
        currencyFilter === "Todas" ? true : property.currency === currencyFilter;
      const matchesLocation =
        locationFilter.trim() === ""
          ? true
          : property.location
              .toLowerCase()
              .includes(locationFilter.trim().toLowerCase());
      const minPrice =
        priceFrom.trim() === "" ? undefined : Number(priceFrom.replace(/\./g, "").replace(",", "."));
      const maxPrice =
        priceTo.trim() === "" ? undefined : Number(priceTo.replace(/\./g, "").replace(",", "."));
      const matchesMinPrice =
        minPrice === undefined || Number.isNaN(minPrice)
          ? true
          : property.numericPrice >= minPrice;
      const matchesMaxPrice =
        maxPrice === undefined || Number.isNaN(maxPrice)
          ? true
          : property.numericPrice <= maxPrice;

      return (
        matchesType &&
        matchesOperation &&
        matchesCurrency &&
        matchesLocation &&
        matchesMinPrice &&
        matchesMaxPrice
      );
    });

    const sortedProperties = [...nextProperties];

    switch (sortOption) {
      case "price-asc":
        sortedProperties.sort((a, b) => a.numericPrice - b.numericPrice);
        break;
      case "price-desc":
        sortedProperties.sort((a, b) => b.numericPrice - a.numericPrice);
        break;
      case "surface-desc":
        sortedProperties.sort((a, b) => b.surfaceM2 - a.surfaceM2);
        break;
      case "surface-asc":
        sortedProperties.sort((a, b) => a.surfaceM2 - b.surfaceM2);
        break;
      case "bedrooms-asc":
        sortedProperties.sort((a, b) => a.bedrooms - b.bedrooms);
        break;
      default:
        sortedProperties.sort((a, b) => {
          const featuredDelta = Number(b.featured ?? false) - Number(a.featured ?? false);
          if (featuredDelta !== 0) {
            return featuredDelta;
          }

          return a.title.localeCompare(b.title, "es");
        });
        break;
    }

    return sortedProperties;
  }, [
    currencyFilter,
    locationFilter,
    operationFilter,
    priceFrom,
    priceTo,
    properties,
    sortOption,
    typeFilter,
  ]);

  const propertiesWithCoords = filteredProperties.filter(
    (property) =>
      typeof property.latitude === "number" &&
      typeof property.longitude === "number",
  );

  const [activeMapPropertyId, setActiveMapPropertyId] = useState<string | null>(
    propertiesWithCoords[0]?.id ?? null,
  );

  useEffect(() => {
    setActiveMapPropertyId((currentId) => {
      if (propertiesWithCoords.length === 0) {
        return null;
      }

      if (currentId && propertiesWithCoords.some((property) => property.id === currentId)) {
        return currentId;
      }

      return propertiesWithCoords[0]?.id ?? null;
    });
  }, [propertiesWithCoords]);

  const activeMapProperty =
    propertiesWithCoords.find((property) => property.id === activeMapPropertyId) ??
    propertiesWithCoords[0];

  async function handleLeadSubmit(property: Property, formData: FormData) {
    const payload = {
      propertyId: property.id,
      fullName: String(formData.get("full_name") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      message: String(formData.get("message") ?? "").trim(),
    };

    startLeadTransition(async () => {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as
        | { lead?: Lead; error?: string }
        | undefined;

      if (!response.ok || !result?.lead) {
        setInquiryState({
          type: "error",
          message:
            result?.error ??
            "No se pudo enviar la consulta en este momento.",
        });
        return;
      }

      setInquiryState({
        type: "success",
        message: `Consulta enviada por ${property.title}. Ya quedo guardada en el CRM.`,
      });
      setLeadPropertyId(null);
    });
  }

  function InquiryForm({ property }: { property: Property }) {
    return (
      <form
        action={(formData) => handleLeadSubmit(property, formData)}
        className="mt-5 space-y-3 rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-cream)] p-4"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <input
            name="full_name"
            required
            placeholder="Nombre y apellido"
            className="w-full rounded-full border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
          />
          <input
            name="phone"
            required
            placeholder="Telefono"
            className="w-full rounded-full border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
          />
        </div>
        <input
          name="email"
          placeholder="Email (opcional)"
          className="w-full rounded-full border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
        />
        <textarea
          name="message"
          rows={4}
          placeholder={`Quiero mas informacion sobre ${property.title}`}
          className="w-full rounded-[1.25rem] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p
            className={`text-sm ${
              inquiryState.type === "error"
                ? "text-[#a04d39]"
                : inquiryState.type === "success"
                  ? "text-[#39704a]"
                  : "text-[var(--color-muted)]"
            }`}
          >
            {inquiryState.message ||
              "Esta consulta quedara asociada a la propiedad en el CRM."}
          </p>
          <button
            type="submit"
            disabled={isSubmittingLead}
            className="rounded-full bg-[var(--color-deep)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmittingLead ? "Enviando..." : "Enviar consulta"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="mt-10 space-y-8">
      <div className="rounded-[2rem] border border-[var(--color-line)] bg-white p-5 shadow-[0_18px_50px_rgba(35,43,50,0.06)]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm uppercase tracking-[0.2em] text-[var(--color-clay)]">
              Tipo
            </span>
            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as PropertyType | "Todos")
              }
              className="w-full rounded-full border border-[var(--color-line)] bg-[var(--color-cream)] px-4 py-3 outline-none"
            >
              {propertyTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm uppercase tracking-[0.2em] text-[var(--color-clay)]">
              Operacion
            </span>
            <select
              value={operationFilter}
              onChange={(event) =>
                setOperationFilter(
                  event.target.value as PropertyOperation | "Todas",
                )
              }
              className="w-full rounded-full border border-[var(--color-line)] bg-[var(--color-cream)] px-4 py-3 outline-none"
            >
              {operationOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm uppercase tracking-[0.2em] text-[var(--color-clay)]">
              Moneda
            </span>
            <select
              value={currencyFilter}
              onChange={(event) =>
                setCurrencyFilter(event.target.value as Property["currency"] | "Todas")
              }
              className="w-full rounded-full border border-[var(--color-line)] bg-[var(--color-cream)] px-4 py-3 outline-none"
            >
              {currencyOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm uppercase tracking-[0.2em] text-[var(--color-clay)]">
              Zona
            </span>
            <input
              value={locationFilter}
              onChange={(event) => setLocationFilter(event.target.value)}
              placeholder="Casilda, Rosario, Funes..."
              className="w-full rounded-full border border-[var(--color-line)] bg-[var(--color-cream)] px-4 py-3 outline-none"
            />
          </label>

          <div className="space-y-2">
            <span className="block text-sm uppercase tracking-[0.2em] text-[var(--color-clay)]">
              Monto
            </span>
            <div className="grid grid-cols-2 gap-3">
              <input
                value={priceFrom}
                onChange={(event) => setPriceFrom(event.target.value)}
                placeholder="Desde"
                inputMode="numeric"
                className="w-full rounded-full border border-[var(--color-line)] bg-[var(--color-cream)] px-4 py-3 outline-none"
              />
              <input
                value={priceTo}
                onChange={(event) => setPriceTo(event.target.value)}
                placeholder="Hasta"
                inputMode="numeric"
                className="w-full rounded-full border border-[var(--color-line)] bg-[var(--color-cream)] px-4 py-3 outline-none"
              />
            </div>
          </div>

          <label className="space-y-2">
            <span className="text-sm uppercase tracking-[0.2em] text-[var(--color-clay)]">
              Orden
            </span>
            <select
              value={sortOption}
              onChange={(event) => setSortOption(event.target.value as SortOption)}
              className="w-full rounded-full border border-[var(--color-line)] bg-[var(--color-cream)] px-4 py-3 outline-none"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-2">
            <span className="block text-sm uppercase tracking-[0.2em] text-[var(--color-clay)]">
              Vista
            </span>
            <div className="flex rounded-full border border-[var(--color-line)] bg-[var(--color-cream)] p-1">
              {[
                { id: "grid", label: "Listado" },
                { id: "map", label: "Mapa" },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setViewMode(option.id as ViewMode)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    viewMode === option.id
                      ? "bg-[var(--color-deep)] text-white"
                      : "text-[var(--color-muted)]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-[var(--color-muted)]">
        <p>
          {filteredProperties.length} propiedad
          {filteredProperties.length === 1 ? "" : "es"} encontrada
          {filteredProperties.length === 1 ? "" : "s"}
        </p>
        <p>{propertiesWithCoords.length} con ubicacion para mapa</p>
      </div>

      {viewMode === "grid" ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredProperties.map((property) => (
            <article
              key={property.id}
              className="overflow-hidden rounded-[2rem] border border-[var(--color-line)] bg-white shadow-[0_22px_60px_rgba(35,43,50,0.08)]"
            >
              <div
                className="h-72 bg-cover bg-center"
                style={{ backgroundImage: `url(${property.cover})` }}
              />
              <div className="space-y-5 p-7">
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="rounded-full bg-[var(--color-cream)] px-3 py-1 text-[var(--color-deep)]">
                    {property.operation}
                  </span>
                  <span className="rounded-full border border-[var(--color-line)] px-3 py-1 text-[var(--color-muted)]">
                    {property.type}
                  </span>
                </div>
                <div>
                  <h4 className="font-serif-display text-3xl">
                    {property.title}
                  </h4>
                  <p className="mt-2 text-[var(--color-muted)]">
                    {property.location}
                  </p>
                </div>
                <div className="flex flex-wrap gap-5 text-sm text-[var(--color-muted)]">
                  <span>{property.surface} totales</span>
                  <span>{property.coveredSurfaceM2} m2 cubiertos</span>
                  <span>{property.rooms} ambientes</span>
                  <span>{property.bedrooms} dormitorios</span>
                  <span>{property.bathrooms} baños</span>
                  <span>{property.price}</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/propiedades/${property.slug}`}
                    className="inline-flex rounded-full border border-[var(--color-line)] px-4 py-2 text-sm text-[var(--color-deep)] transition hover:bg-[var(--color-cream)]"
                  >
                    Ver detalle
                  </Link>
                  {property.mapsUrl ? (
                    <a
                      href={property.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex rounded-full border border-[var(--color-line)] px-4 py-2 text-sm text-[var(--color-deep)] transition hover:bg-[var(--color-cream)]"
                    >
                      Ver en Maps
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setLeadPropertyId((current) =>
                        current === property.id ? null : property.id,
                      );
                      setInquiryState({ type: "idle", message: "" });
                    }}
                    className="inline-flex rounded-full bg-[var(--color-deep)] px-4 py-2 text-sm text-white transition hover:opacity-92"
                  >
                    Consultar
                  </button>
                </div>
                {leadPropertyId === property.id ? <InquiryForm property={property} /> : null}
              </div>
            </article>
          ))}
        </div>
      ) : propertiesWithCoords.length > 0 ? (
        <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
          <div className="space-y-4 xl:max-h-[36rem] xl:overflow-auto xl:pr-2">
            {propertiesWithCoords.map((property) => (
              <article
                key={property.id}
                className={`rounded-[1.75rem] border bg-white p-5 text-left shadow-[0_18px_50px_rgba(35,43,50,0.06)] transition ${
                  property.id === activeMapProperty?.id
                    ? "border-[var(--color-clay)] shadow-[0_22px_55px_rgba(159,107,68,0.18)]"
                    : "border-[var(--color-line)]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveMapPropertyId(property.id)}
                  className="w-full text-left"
                >
                  <p className="text-sm uppercase tracking-[0.25em] text-[var(--color-clay)]">
                    {property.operation} · {property.type}
                  </p>
                  <h4 className="mt-3 font-serif-display text-3xl">
                    {property.title}
                  </h4>
                  <p className="mt-2 text-[var(--color-muted)]">
                    {property.location}
                  </p>
                  <p className="mt-3 text-[var(--color-deep)]">
                    {property.price}
                  </p>
                </button>
              </article>
            ))}
          </div>

          <div className="relative h-[36rem] overflow-hidden rounded-[2rem] border border-[var(--color-line)] bg-[#dde4ea] shadow-[0_22px_60px_rgba(35,43,50,0.08)]">
            <PropertiesLiveMap
              properties={propertiesWithCoords}
              activeProperty={activeMapProperty}
              onSelect={setActiveMapPropertyId}
            />

            {activeMapProperty ? (
              <div className="pointer-events-none absolute inset-x-4 top-4 z-10 md:inset-x-auto md:left-4 md:top-4 md:w-[22rem]">
                <article className="pointer-events-auto overflow-hidden rounded-[1.75rem] border border-white/65 bg-white/92 shadow-[0_22px_60px_rgba(35,43,50,0.16)] backdrop-blur">
                  <div
                    className="h-36 bg-cover bg-center"
                    style={{ backgroundImage: `url(${activeMapProperty.cover})` }}
                  />
                  <div className="space-y-4 p-5">
                    <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.22em] text-[var(--color-clay)]">
                      <span>{activeMapProperty.operation}</span>
                      <span>{activeMapProperty.type}</span>
                    </div>
                    <div>
                      <h4 className="font-serif-display text-3xl leading-none">
                        {activeMapProperty.title}
                      </h4>
                      <p className="mt-2 text-sm text-[var(--color-muted)]">
                        {activeMapProperty.location}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-lg text-[var(--color-deep)]">
                        {activeMapProperty.price}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/propiedades/${activeMapProperty.slug}`}
                          className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm text-[var(--color-deep)] transition hover:bg-[var(--color-cream)]"
                        >
                          Ver detalle
                        </Link>
                        {activeMapProperty.mapsUrl ? (
                          <a
                            href={activeMapProperty.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm text-[var(--color-deep)] transition hover:bg-[var(--color-cream)]"
                          >
                            Abrir en Maps
                          </a>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => {
                            setLeadPropertyId((current) =>
                              current === activeMapProperty.id ? null : activeMapProperty.id,
                            );
                            setInquiryState({ type: "idle", message: "" });
                          }}
                          className="rounded-full bg-[var(--color-deep)] px-4 py-2 text-sm text-white transition hover:opacity-92"
                        >
                          Consultar
                        </button>
                      </div>
                    </div>
                    {leadPropertyId === activeMapProperty.id ? (
                      <InquiryForm property={activeMapProperty} />
                    ) : null}
                  </div>
                </article>
              </div>
            ) : null}

            <div className="absolute inset-x-0 bottom-0 z-10 hidden bg-gradient-to-t from-[rgba(18,28,35,0.58)] via-[rgba(18,28,35,0.2)] to-transparent px-4 pb-4 pt-16 md:block">
              <div className="flex gap-3 overflow-x-auto pb-2">
                {propertiesWithCoords.map((property) => (
                  <button
                    key={property.id}
                    type="button"
                    onClick={() => setActiveMapPropertyId(property.id)}
                    className={`min-w-[15rem] rounded-[1.4rem] border px-4 py-4 text-left text-white backdrop-blur transition ${
                      property.id === activeMapProperty?.id
                        ? "border-white/80 bg-[rgba(255,255,255,0.2)]"
                        : "border-white/20 bg-[rgba(19,30,38,0.45)] hover:bg-[rgba(19,30,38,0.58)]"
                    }`}
                  >
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/72">
                      {property.operation} · {property.type}
                    </p>
                    <h5 className="mt-2 font-serif-display text-2xl leading-none">
                      {property.title}
                    </h5>
                    <p className="mt-2 text-sm text-white/72">
                      {property.location}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-[2rem] border border-[var(--color-line)] bg-white px-6 py-10 text-[var(--color-muted)] shadow-[0_18px_50px_rgba(35,43,50,0.06)]">
          Ninguna de las propiedades filtradas tiene coordenadas cargadas
          todavia. Puedes agregarlas desde el panel admin para que aparezcan en
          el mapa.
        </div>
      )}
    </div>
  );
}
