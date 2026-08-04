const NOMINATIM = "https://nominatim.openstreetmap.org";

export interface GeoPlace {
  lat: number;
  lng: number;
  address: string;
  city: string;
  country: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    road?: string;
    pedestrian?: string;
    footway?: string;
    house_number?: string;
    neighbourhood?: string;
    suburb?: string;
    quarter?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    country?: string;
  };
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeoPlace | null> {
  try {
    const res = await fetch(
      `${NOMINATIM}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=uz`,
    );
    if (!res.ok) return null;
    const data: NominatimResult = await res.json();
    const a = data.address ?? {};
    const address = [
      a.house_number || "",
      a.road || a.pedestrian || a.footway || "",
      a.quarter || "",
      a.neighbourhood || "",
      a.suburb || "",
    ]
      .filter(Boolean)
      .join(", ");
    const city = a.city || a.town || a.village || a.municipality || a.county || "";
    return { lat, lng, address, city, country: a.country ?? "" };
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
    return data.map((r) => {
      const a = r.address ?? {};
      const short = [
        a.house_number || "",
        a.road || "",
        a.quarter || "",
        a.neighbourhood || "",
        a.suburb || "",
      ]
        .filter(Boolean)
        .join(", ");
      return {
        lat: Number(r.lat),
        lng: Number(r.lon),
        address: short || r.display_name,
        city: a.city || a.town || a.village || a.municipality || a.county || "",
        country: a.country ?? "",
      };
    });
  } catch {
    return [];
  }
}
