export type GeoPoint = {
  lat: number;
  lng: number;
};

/** Склад по умолчанию — центр Бишкека, пока в env нет своих координат. */
export const DEFAULT_SHOP_POINT: GeoPoint = {
  lat: 42.8746,
  lng: 74.5698,
};

export const DGIS_CITY_SLUG = "bishkek";

export function parseGeoPoint(
  latRaw: string | undefined,
  lngRaw: string | undefined,
  fallback: GeoPoint = DEFAULT_SHOP_POINT,
): GeoPoint {
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  ) {
    return { lat, lng };
  }
  return fallback;
}

export function haversineKm(from: GeoPoint, to: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) *
      Math.cos(toRad(to.lat)) *
      Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Городская доставка: выезд + средняя 22 км/ч. */
export function estimateEtaMinutes(distanceKm: number): number {
  const minutes = Math.round(8 + (Math.max(0, distanceKm) / 22) * 60);
  return Math.min(90, Math.max(12, minutes));
}

export function formatEtaLabel(minutes: number): string {
  const safe = Math.max(1, Math.floor(minutes));
  if (safe < 60) {
    return `~${safe} мин`;
  }
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;
  return rest > 0 ? `~${hours} ч ${rest} мин` : `~${hours} ч`;
}

export function dgisRouteHttpsUrl(from: GeoPoint, to: GeoPoint): string {
  return `https://2gis.kg/${DGIS_CITY_SLUG}/routeSearch/rsType/car/from/${from.lng},${from.lat}/to/${to.lng},${to.lat}`;
}

export function dgisRouteAppUrl(from: GeoPoint, to: GeoPoint): string {
  return `dgis://2gis.ru/routeSearch/rsType/car/from/${from.lng},${from.lat}/to/${to.lng},${to.lat}`;
}

export function dgisSearchHttpsUrl(address: string): string {
  const query = address.trim();
  return `https://2gis.kg/${DGIS_CITY_SLUG}/search/${encodeURIComponent(query)}`;
}

export type OrderDeliveryPublic = {
  shopLat: number;
  shopLng: number;
  destLat: number | null;
  destLng: number | null;
  etaMinutes: number | null;
  dgisUrl: string;
};

export function toOrderDeliveryPublic(input: {
  address: string;
  destLat: number | null | undefined;
  destLng: number | null | undefined;
  etaMinutes: number | null | undefined;
  shop?: GeoPoint;
}): OrderDeliveryPublic {
  const shop = input.shop ?? DEFAULT_SHOP_POINT;
  const destLat =
    typeof input.destLat === "number" && Number.isFinite(input.destLat)
      ? input.destLat
      : null;
  const destLng =
    typeof input.destLng === "number" && Number.isFinite(input.destLng)
      ? input.destLng
      : null;
  const dest =
    destLat != null && destLng != null ? { lat: destLat, lng: destLng } : null;
  const storedEta =
    typeof input.etaMinutes === "number" && input.etaMinutes > 0
      ? Math.floor(input.etaMinutes)
      : null;
  const etaMinutes =
    storedEta ??
    (dest ? estimateEtaMinutes(haversineKm(shop, dest)) : null);
  return {
    shopLat: shop.lat,
    shopLng: shop.lng,
    destLat,
    destLng,
    etaMinutes,
    dgisUrl: dest
      ? dgisRouteHttpsUrl(shop, dest)
      : dgisSearchHttpsUrl(input.address),
  };
}
