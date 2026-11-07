import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";

interface AddressMapPreviewProps {
  lat: number;
  lng: number;
  ariaLabel?: string;
  className?: string;
}

export function AddressMapPreview({ lat, lng, ariaLabel, className }: AddressMapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let active = true;
    let map: LeafletMap | null = null;

    (async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (!active) return;

      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      map = L.map(container, {
        center: [lat, lng],
        zoom: 15,
        scrollWheelZoom: false,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      L.marker([lat, lng], { draggable: false, interactive: false }).addTo(map);

      setTimeout(() => map?.invalidateSize(), 0);
    })();

    return () => {
      active = false;
      if (map) map.remove();
    };
  }, [lat, lng]);

  return <div ref={containerRef} role="img" aria-label={ariaLabel} className={className} />;
}
