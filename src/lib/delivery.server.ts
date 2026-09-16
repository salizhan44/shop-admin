import {
  estimateEtaMinutes,
  haversineKm,
  parseGeoPoint,
  type GeoPoint,
} from "./delivery.shared";

const GEOCODE_TIMEOUT_MS = 4500;

export function getShopPoint(): GeoPoint {
  return parseGeoPoint(process.env.SHOP_LAT, process.env.SHOP_LNG);
}

async function fetchJson(
  url: string,
  init?: RequestInit,
): Promise<unknown | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEOCODE_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as unknown;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function readDgisPoint(data: unknown): GeoPoint | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const items = (data as { result?: { items?: unknown } }).result?.items;
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }
  const point = (items[0] as { point?: { lat?: unknown; lon?: unknown } })
    .point;
  const lat = Number(point?.lat);
  const lng = Number(point?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  return { lat, lng };
}

async function geocodeWithDgis(address: string, key: string): Promise<GeoPoint | null> {
  const query = `Бишкек, ${address}`;
  const url = `https://catalog.api.2gis.com/3.0/items/geocode?q=${encodeURIComponent(query)}&fields=items.point&key=${encodeURIComponent(key)}`;
  return readDgisPoint(await fetchJson(url));
}

async function geocodeWithNominatim(address: string): Promise<GeoPoint | null> {
  const query = `${address}, Bishkek, Kyrgyzstan`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  const data = await fetchJson(url, {
    headers: { "User-Agent": "ROLA-shop/1.0 (delivery)" },
  });
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }
  const lat = Number((data[0] as { lat?: unknown }).lat);
  const lng = Number((data[0] as { lon?: unknown }).lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  return { lat, lng };
}

async function etaFromDgis(
  from: GeoPoint,
  to: GeoPoint,
  key: string,
): Promise<number | null> {
  const url = `https://routing.api.2gis.com/routing/7.0.0/global?key=${encodeURIComponent(key)}`;
  const data = await fetchJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      points: [
        { type: "stop", lon: from.lng, lat: from.lat },
        { type: "stop", lon: to.lng, lat: to.lat },
      ],
      transport: "driving",
      route_mode: "fastest",
      traffic_mode: "jam",
      output: "summary",
    }),
  });
  if (!data || typeof data !== "object") {
    return null;
  }
  const result = (data as { result?: unknown }).result;
  const first = Array.isArray(result) ? result[0] : result;
  const seconds = Number(
    (first as { total_duration?: unknown } | undefined)?.total_duration,
  );
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }
  return Math.min(90, Math.max(12, Math.round(seconds / 60)));
}

export async function resolveDeliveryForAddress(address: string): Promise<{
  destLat: number;
  destLng: number;
  etaMinutes: number;
} | null> {
  const trimmed = address.trim();
  if (trimmed.length < 5) {
    return null;
  }
  const shop = getShopPoint();
  const key = process.env.DGIS_API_KEY?.trim() ?? "";
  const dest =
    (key ? await geocodeWithDgis(trimmed, key) : null) ??
    (await geocodeWithNominatim(trimmed));
  if (!dest) {
    return null;
  }
  const eta =
    (key ? await etaFromDgis(shop, dest, key) : null) ??
    estimateEtaMinutes(haversineKm(shop, dest));
  return {
    destLat: dest.lat,
    destLng: dest.lng,
    etaMinutes: eta,
  };
}
