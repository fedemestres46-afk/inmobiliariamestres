"use client";

import { useMemo } from "react";
import type { Property } from "@/data/properties";

type Props = {
  properties: Property[];
  activeProperty?: Property;
  onSelect: (propertyId: string) => void;
};

function buildOpenStreetMapEmbedUrl(latitude: number, longitude: number) {
  const delta = 0.008;
  const left = longitude - delta;
  const right = longitude + delta;
  const top = latitude + delta;
  const bottom = latitude - delta;

  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${latitude}%2C${longitude}`;
}

export function PropertiesLiveMap({
  properties,
  activeProperty,
  onSelect,
}: Props) {
  const focusedProperty = activeProperty ?? properties[0];

  const embedUrl = useMemo(() => {
    if (
      !focusedProperty ||
      typeof focusedProperty.latitude !== "number" ||
      typeof focusedProperty.longitude !== "number"
    ) {
      return null;
    }

    return buildOpenStreetMapEmbedUrl(
      focusedProperty.latitude,
      focusedProperty.longitude,
    );
  }, [focusedProperty]);

  if (!embedUrl || !focusedProperty) {
    return (
      <div className="flex h-full items-center justify-center bg-[#dde4ea] px-6 text-center text-sm text-[#52606b]">
        No hay una ubicacion valida para mostrar en el mapa.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-[#dde4ea]">
      <iframe
        key={`${focusedProperty.id}-${focusedProperty.latitude}-${focusedProperty.longitude}`}
        title={`Mapa de ${focusedProperty.title}`}
        src={embedUrl}
        className="h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />

      {properties.length > 1 ? (
        <div className="absolute bottom-4 left-4 right-4 z-10 md:hidden">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {properties.map((property) => (
              <button
                key={property.id}
                type="button"
                onClick={() => onSelect(property.id)}
                className={`min-w-[14rem] rounded-[1.25rem] border px-4 py-3 text-left shadow-[0_12px_30px_rgba(19,30,38,0.18)] backdrop-blur transition ${
                  property.id === focusedProperty.id
                    ? "border-white/90 bg-white text-[#203947]"
                    : "border-white/35 bg-[rgba(19,30,38,0.75)] text-white"
                }`}
              >
                <p className="text-[11px] uppercase tracking-[0.22em] opacity-70">
                  {property.operation} · {property.type}
                </p>
                <h5 className="mt-2 font-serif-display text-2xl leading-none">
                  {property.title}
                </h5>
                <p className="mt-2 text-sm opacity-75">{property.location}</p>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
