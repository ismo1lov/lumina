const NOMINATIM = "https://nominatim.openstreetmap.org";
const YANDEX_GEOCODER_KEY = (import.meta.env.VITE_YANDEX_GEOCODER_API_KEY ||
  import.meta.env.VITE_YANDEX_MAPS_API_KEY) as string | undefined;

export interface GeoPlace {
  lat: number;
  lng: number;
  address: string;
  city: string;
  country: string;
}

interface NominatimAddress {
  road?: string;
  pedestrian?: string;
  footway?: string;
  house_number?: string;
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  locality?: string;
  city_district?: string;
  district?: string;
  borough?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  region?: string;
  postcode?: string;
  country?: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
}

interface YandexGeocodeResponse {
  response?: {
    GeoObjectCollection?: {
      featureMember?: Array<{
        GeoObject?: {
          name?: string;
          description?: string;
          metaDataProperty?: {
            GeocoderMetaData?: {
              text?: string;
              Address?: {
                formatted?: string;
                Components?: Array<{ kind?: string; name?: string }>;
              };
            };
          };
        };
      }>;
    };
  };
}

function cityFromAddress(address: NominatimAddress): string {
  return (
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.county ||
    address.state ||
    ""
  );
}

function normalizeAddressPart(value: string): string {
  return value.toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

function formatNominatimAddress(result: NominatimResult): string {
  const address = result.address ?? {};
  const city = cityFromAddress(address);
  const country = address.country ?? "";
  const postcode = address.postcode ?? "";
  const street = address.road || address.pedestrian || address.footway;
  const houseNumber = address.house_number;

  // Nominatim's display_name already contains the full hierarchy in the
  // right order. Drop the parts we show in separate fields (city, postcode,
  // country) and keep street, house number, mahalla and district.
  const parts = result.display_name
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => part !== city && part !== country && part !== postcode)
    .filter((part) => !/^\d{5,6}$/.test(part));

  const exactPart = (value: string) =>
    parts.some((part) => normalizeAddressPart(part) === normalizeAddressPart(value));
  const fuzzyPart = (value: string) =>
    parts.some(
      (part) =>
        normalizeAddressPart(part).includes(normalizeAddressPart(value)) ||
        normalizeAddressPart(value).includes(normalizeAddressPart(part)),
    );

  // Reverse geocoding can return a road-only display_name even when the
  // address object contains the street and house number. Add those
  // explicitly so the form always shows the most precise parts available.
  if (street && !fuzzyPart(street)) parts.unshift(street);
  if (houseNumber && !exactPart(houseNumber)) {
    const streetIndex = street
      ? parts.findIndex((part) => normalizeAddressPart(part).includes(normalizeAddressPart(street)))
      : -1;
    if (streetIndex >= 0) parts.splice(streetIndex + 1, 0, houseNumber);
    else parts.unshift(houseNumber);
  }

  for (const detail of [
    address.locality,
    address.quarter,
    address.neighbourhood,
    address.suburb,
    address.district || address.city_district || address.borough,
  ]) {
    if (detail && !fuzzyPart(detail)) parts.push(detail);
  }

  const uniqueParts = Array.from(new Set(parts));
  if (uniqueParts.length > 0) return uniqueParts.join(", ");

  return Array.from(
    new Set(
      [
        street,
        houseNumber,
        address.locality,
        address.quarter,
        address.neighbourhood,
        address.suburb,
        address.district || address.city_district || address.borough,
      ].filter(Boolean),
    ),
  ).join(", ");
}

async function reverseGeocodeYandex(lat: number, lng: number): Promise<GeoPlace | null> {
  if (!YANDEX_GEOCODER_KEY) return null;

  try {
    const url = new URL("https://geocode-maps.yandex.ru/1.x/");
    url.searchParams.set("apikey", YANDEX_GEOCODER_KEY);
    url.searchParams.set("geocode", `${lng},${lat}`);
    url.searchParams.set("format", "json");
    url.searchParams.set("results", "1");
    url.searchParams.set("lang", "en_US");

    const res = await fetch(url);
    if (!res.ok) return null;

    const data: YandexGeocodeResponse = await res.json();
    const object = data.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
    const meta = object?.metaDataProperty?.GeocoderMetaData;
    const components = meta?.Address?.Components ?? [];
    const address = meta?.Address?.formatted || meta?.text || object?.name || "";
    if (!address) return null;

    return {
      lat,
      lng,
      address,
      city: components.find((component) => component.kind === "locality")?.name ?? "",
      country: components.find((component) => component.kind === "country")?.name ?? "",
    };
  } catch {
    return null;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeoPlace | null> {
  const yandexPlace = await reverseGeocodeYandex(lat, lng);
  if (yandexPlace) return yandexPlace;

  try {
    const res = await fetch(
      `${NOMINATIM}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&layer=address&accept-language=uz`,
    );
    if (!res.ok) return null;
    const data: NominatimResult = await res.json();
    const address = data.address ?? {};
    return {
      lat,
      lng,
      address: formatNominatimAddress(data),
      city: cityFromAddress(address),
      country: address.country ?? "",
    };
  } catch {
    return null;
  }
}

export async function geocodeAddress(query: string): Promise<GeoPlace[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const res = await fetch(
      `${NOMINATIM}/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=5&accept-language=uz`,
    );
    if (!res.ok) return [];
    const data: NominatimResult[] = await res.json();
    return data.map((result) => {
      const address = result.address ?? {};
      return {
        lat: Number(result.lat),
        lng: Number(result.lon),
        address: formatNominatimAddress(result) || result.display_name,
        city: cityFromAddress(address),
        country: address.country ?? "",
      };
    });
  } catch {
    return [];
  }
}
