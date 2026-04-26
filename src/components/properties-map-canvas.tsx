import type { Property } from "@/data/properties";

type Props = {
  properties: Property[];
  activeProperty?: Property;
  onSelect: (propertyId: string) => void;
};

function getGoogleEmbedUrl(property: Property) {
  if (
    typeof property.latitude === "number" &&
    typeof property.longitude === "number"
  ) {
    const delta = 0.0065;
    const left = property.longitude - delta;
    const right = property.longitude + delta;
    const top = property.latitude + delta;
    const bottom = property.latitude - delta;

    return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${property.latitude}%2C${property.longitude}`;
  }

  if (property.mapsUrl) {
    return property.mapsUrl;
  }

  const encodedLocation = encodeURIComponent(property.location);
  return `https://www.openstreetmap.org/search?query=${encodedLocation}`;
}

export function PropertiesMapCanvas({
  properties,
  activeProperty,
  onSelect,
}: Props) {
  if (properties.length === 0) {
    return (
      <div className="flex h-[36rem] items-center justify-center rounded-[2rem] border border-[var(--color-line)] bg-white px-6 text-center text-[var(--color-muted)] shadow-[0_22px_60px_rgba(35,43,50,0.08)]">
        Ninguna de las propiedades filtradas tiene coordenadas cargadas todavia.
      </div>
    );
  }

  const currentProperty = activeProperty ?? properties[0];

  return (
    <div className="relative h-[36rem] overflow-hidden rounded-[2rem] border border-[var(--color-line)] bg-[#dde4ea] shadow-[0_22px_60px_rgba(35,43,50,0.08)]">
      <iframe
        key={`${currentProperty.id}-${currentProperty.latitude}-${currentProperty.longitude}-${currentProperty.mapsUrl ?? ""}`}
        title={`Mapa de ${currentProperty.title}`}
        src={getGoogleEmbedUrl(currentProperty)}
        className="h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />

      <div className="pointer-events-none absolute inset-x-4 top-4 z-10 md:inset-x-auto md:left-4 md:top-4 md:w-[22rem]">
        <article className="pointer-events-auto overflow-hidden rounded-[1.75rem] border border-white/65 bg-white/92 shadow-[0_22px_60px_rgba(35,43,50,0.16)] backdrop-blur">
          <div
            className="h-36 bg-cover bg-center"
            style={{ backgroundImage: `url(${currentProperty.cover})` }}
          />
          <div className="space-y-4 p-5">
            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.22em] text-[var(--color-clay)]">
              <span>{currentProperty.operation}</span>
              <span>{currentProperty.type}</span>
            </div>
            <div>
              <h4 className="font-serif-display text-3xl leading-none">
                {currentProperty.title}
              </h4>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                {currentProperty.location}
              </p>
            </div>
            <div className="flex items-center justify-between gap-4">
              <p className="text-lg text-[var(--color-deep)]">
                {currentProperty.price}
              </p>
              {currentProperty.mapsUrl ? (
                <a
                  href={currentProperty.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm text-[var(--color-deep)] transition hover:bg-[var(--color-cream)]"
                >
                  Abrir en Maps
                </a>
              ) : null}
            </div>
          </div>
        </article>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 hidden bg-gradient-to-t from-[rgba(18,28,35,0.58)] via-[rgba(18,28,35,0.2)] to-transparent px-4 pb-4 pt-16 md:block">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {properties.map((property) => (
            <button
              key={property.id}
              type="button"
              onClick={() => onSelect(property.id)}
              className={`min-w-[15rem] rounded-[1.4rem] border px-4 py-4 text-left text-white backdrop-blur transition ${
                property.id === currentProperty.id
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
              <p className="mt-2 text-sm text-white/72">{property.location}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
