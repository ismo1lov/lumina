import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

interface YandexMapProps {
  lat: number;
  lng: number;
  zoom?: number;
  title?: string;
  className?: string;
  loading?: "lazy" | "eager";
  interactive?: boolean;
  onChange?: (lat: number, lng: number) => void;
}

interface YandexGeometry {
  getCoordinates: () => [number, number];
  setCoordinates: (coords: [number, number]) => void;
}

interface YandexGeoObject {
  geometry: YandexGeometry;
  events: {
    add: (event: string, handler: () => void) => void;
  };
}

interface YandexMapEvent {
  get: (key: string) => unknown;
}

interface YandexMapInstance {
  geoObjects: {
    add: (object: YandexGeoObject) => void;
  };
  events: {
    add: (event: string, handler: (event: YandexMapEvent) => void) => void;
  };
  behaviors: {
    enable: (name: string) => void;
  };
  container: {
    fitToViewport: () => void;
  };
  setCenter: (coords: [number, number], zoom?: number, options?: { duration?: number }) => void;
  destroy: () => void;
}

interface YandexApi {
  ready: (callback: () => void) => void;
  Map: new (
    element: HTMLElement,
    state: { center: [number, number]; zoom: number; controls?: string[] },
  ) => YandexMapInstance;
  Placemark: new (
    coords: [number, number],
    properties?: Record<string, unknown>,
    options?: { draggable?: boolean; preset?: string },
  ) => YandexGeoObject;
}

type YandexWindow = Window & { ymaps?: YandexApi };

const API_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY as string | undefined;
let apiPromise: Promise<YandexApi> | null = null;

function loadYandexApi(lang: "uz" | "ru"): Promise<YandexApi> {
  const existing = (window as YandexWindow).ymaps;
  if (existing) {
    return new Promise((resolve) => existing.ready(() => resolve(existing)));
  }
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<YandexApi>((resolve, reject) => {
    const params = new URLSearchParams({ lang: lang === "ru" ? "ru_RU" : "en_US" });
    if (API_KEY) params.set("apikey", API_KEY);

    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/2.1/?${params.toString()}`;
    script.async = true;
    script.dataset.yandexMaps = "true";
    script.onload = () => {
      const api = (window as YandexWindow).ymaps;
      if (!api) {
        apiPromise = null;
        reject(new Error("Yandex Maps failed to load"));
        return;
      }
      api.ready(() => resolve(api));
    };
    script.onerror = () => {
      apiPromise = null;
      reject(new Error("Yandex Maps failed to load"));
    };
    document.head.appendChild(script);
  });

  return apiPromise;
}

export function YandexMap({
  lat,
  lng,
  zoom = 15,
  title,
  className,
  loading = "lazy",
  interactive = false,
  onChange,
}: YandexMapProps) {
  const { lang } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<YandexMapInstance | null>(null);
  const markerRef = useRef<YandexGeoObject | null>(null);
  const coordsRef = useRef({ lat, lng });
  const zoomRef = useRef(zoom);
  const onChangeRef = useRef(onChange);
  const interactiveRef = useRef(interactive);
  const fromMapRef = useRef(false);
  const [failed, setFailed] = useState(false);

  const langCode = lang === "ru" ? "ru_RU" : "en_US";
  const embedSrc = `https://yandex.uz/map-widget/v1/?ll=${lng}%2C${lat}&z=${zoom}&pt=${lng}%2C${lat}%2Cpm2rdm&lang=${langCode}&l=map`;

  useEffect(() => {
    onChangeRef.current = onChange;
    interactiveRef.current = interactive;
  }, [onChange, interactive]);

  useEffect(() => {
    coordsRef.current = { lat, lng };
    zoomRef.current = zoom;

    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;

    const [currentLat, currentLng] = marker.geometry.getCoordinates();
    if (currentLat !== lat || currentLng !== lng) {
      marker.geometry.setCoordinates([lat, lng]);
    }
    if (fromMapRef.current) {
      fromMapRef.current = false;
      return;
    }
    map.setCenter([lat, lng], zoom, { duration: 300 });
  }, [lat, lng, zoom]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let active = true;
    let map: YandexMapInstance | null = null;
    let resizeObserver: ResizeObserver | null = null;

    loadYandexApi(lang)
      .then((ymaps) => {
        if (!active || !containerRef.current) return;
        const start = coordsRef.current;

        map = new ymaps.Map(container, {
          center: [start.lat, start.lng],
          zoom: zoomRef.current,
          controls: ["zoomControl"],
        });
        map.behaviors.enable("scrollZoom");

        const marker = new ymaps.Placemark(
          [start.lat, start.lng],
          {},
          { draggable: interactive, preset: "islands#redDotIcon" },
        );
        map.geoObjects.add(marker);

        marker.events.add("dragend", () => {
          const [nextLat, nextLng] = marker.geometry.getCoordinates();
          const changed = coordsRef.current.lat !== nextLat || coordsRef.current.lng !== nextLng;
          coordsRef.current = { lat: nextLat, lng: nextLng };
          fromMapRef.current = changed;
          onChangeRef.current?.(nextLat, nextLng);
        });

        map.events.add("click", (event) => {
          if (!interactiveRef.current) return;
          const coords = event.get("coords");
          if (!Array.isArray(coords) || coords.length < 2) return;

          const nextLat = Number(coords[0]);
          const nextLng = Number(coords[1]);
          const changed = coordsRef.current.lat !== nextLat || coordsRef.current.lng !== nextLng;
          marker.geometry.setCoordinates([nextLat, nextLng]);
          coordsRef.current = { lat: nextLat, lng: nextLng };
          fromMapRef.current = changed;
          onChangeRef.current?.(nextLat, nextLng);
        });

        mapRef.current = map;
        markerRef.current = marker;

        resizeObserver = new ResizeObserver(() => {
          map?.container.fitToViewport();
        });
        resizeObserver.observe(container);
        requestAnimationFrame(() => map?.container.fitToViewport());
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
      resizeObserver?.disconnect();
      if (map) map.destroy();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [interactive, lang]);

  if (failed) {
    return (
      <iframe
        src={embedSrc}
        title={title ?? "Yandex Maps"}
        className={className}
        loading={loading}
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        data-lenis-prevent=""
      />
    );
  }

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={title ?? "Yandex Maps"}
      data-lenis-prevent=""
      className={`lumina-yandex-map ${className ?? ""} overflow-hidden`}
    />
  );
}
