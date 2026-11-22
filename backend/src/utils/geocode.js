// Reverse geocoding via OpenStreetMap Nominatim (free, no API key).
// Usage policy: max 1 request/second and a real User-Agent. We cache results
// by rounded coordinates, so repeated pins in the same spot cost nothing.

const cache = new Map(); // "lat,lng" (3 decimals ~ 110 m) -> { state, city }
const MAX_CACHE = 500;

export async function reverseGeocode(lat, lng) {
  const key = `${Number(lat).toFixed(3)},${Number(lng).toFixed(3)}`;
  if (cache.has(key)) return cache.get(key);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);

  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&addressdetails=1` +
      `&accept-language=en&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "CivicPulse/1.0 (student project; github.com/Kakul22/CivicPulse)" },
    });
    if (!res.ok) return { state: null, city: null };

    const data = await res.json();
    const a = data.address || {};

    const result = {
      state: a.state || a.union_territory || null,
      city:
        a.city || a.town || a.village || a.municipality ||
        a.city_district || a.county || a.state_district || null,
    };

    if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
    cache.set(key, result);
    return result;
  } catch {
    // Geocoding is a nice-to-have. If it fails or times out, the issue must
    // still be saved, just without state/city.
    return { state: null, city: null };
  } finally {
    clearTimeout(timer);
  }
}
