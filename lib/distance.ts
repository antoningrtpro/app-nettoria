const DEPART_ADDRESS = process.env.NEXT_PUBLIC_DEPART_ADDRESS || 'Palaiseau, 91120, France';
const ORS_API_KEY = process.env.OPENROUTESERVICE_API_KEY || '';
const DEFAULT_DISTANCE_KM = 30;

export interface GeoResult {
  lat: number;
  lon: number;
}

export async function geocodeAddress(address: string): Promise<GeoResult> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'NETTORIA-Pricing/1.0 (project.nettoria@gmail.com)' },
  });
  if (!res.ok) throw new Error('Nominatim error');
  const data = await res.json();
  if (!data.length) throw new Error('Address not found');
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

export async function getRouteDistanceKm(
  origin: GeoResult,
  destination: GeoResult
): Promise<number> {
  if (!ORS_API_KEY) throw new Error('No ORS key');
  const url = 'https://api.openrouteservice.org/v2/directions/driving-hgv';
  const body = {
    coordinates: [
      [origin.lon, origin.lat],
      [destination.lon, destination.lat],
    ],
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: ORS_API_KEY,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    // fallback to car route
    const url2 = 'https://api.openrouteservice.org/v2/directions/driving-car';
    const res2 = await fetch(url2, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: ORS_API_KEY },
      body: JSON.stringify(body),
    });
    if (!res2.ok) throw new Error('ORS error');
    const data2 = await res2.json();
    return data2.routes[0].summary.distance / 1000;
  }
  const data = await res.json();
  return data.routes[0].summary.distance / 1000;
}

export async function calculateDistance(destinationAddress: string): Promise<{ km: number; estimated: boolean }> {
  try {
    const [origin, destination] = await Promise.all([
      geocodeAddress(DEPART_ADDRESS),
      geocodeAddress(destinationAddress),
    ]);
    const km = await getRouteDistanceKm(origin, destination);
    return { km: Math.round(km), estimated: false };
  } catch {
    return { km: DEFAULT_DISTANCE_KM, estimated: true };
  }
}
