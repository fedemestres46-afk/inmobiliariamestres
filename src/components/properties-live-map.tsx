"use client";

import { useEffect, useMemo, useRef } from "react";
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
  const popupByPropertyIdRef = useRef<Map<string, any>>(new Map());
  const focusedIdsRef = useRef<string>("");

  const validProperties = useMemo(
    () =>
      properties.filter(
        (property) =>
          typeof property.latitude === "number" &&
          typeof property.longitude === "number",
      ),
    [properties],
  );

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
      const map = L.map(mapElementRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView([-32.952164, -60.6550428], 13);

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
      popupByPropertyIdRef.current.clear();

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      markersLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;

    if (!L || !map || !markersLayer) {
      return;
    }

    markersLayer.clearLayers();
    popupByPropertyIdRef.current.clear();

    if (validProperties.length === 0) {
      map.setView([-32.952164, -60.6550428], 13, { animate: false });
      return;
    }

    validProperties.forEach((property) => {
      const isActive = property.id === activeProperty?.id;
      const marker = L.marker([property.latitude!, property.longitude!], {
        icon: L.divIcon({
          className: "property-live-marker-shell",
          html: `<span class="property-live-marker${isActive ? " is-active" : ""}">${property.price}</span>`,
          iconSize: [132, 40],
          iconAnchor: [66, 20],
        }),
      });

      marker.on("click", () => onSelect(property.id));
      marker.addTo(markersLayer);

      const popup = L.popup({
        closeButton: false,
        autoClose: false,
        closeOnClick: false,
        offset: [0, -8],
      }).setContent(
        `<div style="min-width:180px"><strong>${property.title}</strong><br/>${property.location}<br/>${property.price}</div>`,
      );

      popupByPropertyIdRef.current.set(property.id, { marker, popup });

      if (isActive) {
        marker.setZIndexOffset(1000);
      }
    });

    const idsSignature = validProperties.map((property) => property.id).join(",");
    const didPropertySetChange = focusedIdsRef.current !== idsSignature;
    focusedIdsRef.current = idsSignature;

    if (validProperties.length === 1) {
      const [property] = validProperties;
      map.setView([property.latitude!, property.longitude!], 16, {
        animate: false,
      });
      return;
    }

    if (didPropertySetChange) {
      const bounds = L.latLngBounds(
        validProperties.map((property) => [
          property.latitude!,
          property.longitude!,
        ] as [number, number]),
      );
      map.fitBounds(bounds, {
        padding: [48, 48],
        maxZoom: 15,
        animate: false,
      });
    }
  }, [activeProperty?.id, onSelect, validProperties]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const activeEntry = activeProperty
      ? popupByPropertyIdRef.current.get(activeProperty.id)
      : null;

    popupByPropertyIdRef.current.forEach(({ marker, popup }, propertyId) => {
      if (activeEntry && propertyId === activeProperty?.id) {
        marker.bindPopup(popup).openPopup();
        marker.setZIndexOffset(1000);
      } else {
        marker.closePopup();
        marker.setZIndexOffset(0);
      }
    });
  }, [activeProperty]);

  return <div ref={mapElementRef} className="h-full w-full" />;
}
