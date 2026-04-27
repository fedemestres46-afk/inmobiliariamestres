"use client";

import { useEffect, useRef } from "react";
import type { Property } from "@/data/properties";

type Props = {
  properties: Property[];
  activeProperty?: Property;
  onSelect: (propertyId: string) => void;
};

type LeafletModule = typeof import("leaflet");

export function PropertiesLiveMap({
  properties,
  activeProperty,
  onSelect,
}: Props) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const mapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function setupMap() {
      if (!mapElementRef.current || mapRef.current) {
        return;
      }

      const L = await import("leaflet");
      if (cancelled || !mapElementRef.current) {
        return;
      }

      leafletRef.current = L;

      const initialProperty = activeProperty ?? properties[0];
      const initialCenter =
        typeof initialProperty?.latitude === "number" &&
        typeof initialProperty?.longitude === "number"
          ? [initialProperty.latitude, initialProperty.longitude]
          : [-32.952164, -60.6550428];

      const map = L.map(mapElementRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView(initialCenter as [number, number], 15);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      window.setTimeout(() => {
        map.invalidateSize();
      }, 120);
    }

    void setupMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersLayerRef.current = null;
    };
  }, [activeProperty, properties]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;

    if (!L || !map || !markersLayer) {
      return;
    }

    window.setTimeout(() => {
      map.invalidateSize();
    }, 60);

    markersLayer.clearLayers();

    const validProperties = properties.filter(
      (property) =>
        typeof property.latitude === "number" &&
        typeof property.longitude === "number",
    );

    validProperties.forEach((property) => {
      const isActive = property.id === activeProperty?.id;
      const circleMarker = L.circleMarker([property.latitude!, property.longitude!], {
        radius: isActive ? 12 : 9,
        color: "#ffffff",
        weight: 3,
        fillColor: isActive ? "#9f6b44" : "#203947",
        fillOpacity: 1,
      });
      circleMarker.on("click", () => onSelect(property.id));
      circleMarker.addTo(markersLayer);

      if (isActive) {
        circleMarker.bringToFront();
      }
    });

    if (validProperties.length === 0) {
      map.setView([-32.952164, -60.6550428], 13, {
        animate: false,
      });
      return;
    }

    if (
      activeProperty &&
      typeof activeProperty.latitude === "number" &&
      typeof activeProperty.longitude === "number"
    ) {
      map.setView([activeProperty.latitude, activeProperty.longitude], 16, {
        animate: false,
      });
      return;
    }

    if (validProperties.length > 1) {
      const bounds = L.latLngBounds(
        validProperties.map((property) => [
          property.latitude!,
          property.longitude!,
        ] as [number, number]),
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: false });
      return;
    }

    if (validProperties.length === 1) {
      const [property] = validProperties;
      map.setView([property.latitude!, property.longitude!], 16, {
        animate: false,
      });
    }
  }, [activeProperty, onSelect, properties]);

  return <div ref={mapElementRef} className="h-full w-full" />;
}
