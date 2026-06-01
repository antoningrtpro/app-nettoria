const DEPART_LAT = 48.7262;
const DEPART_LON = 2.2484; // Palaiseau, 91120

const ORS_API_KEY = process.env.OPENROUTESERVICE_API_KEY || '';
const DEFAULT_DISTANCE_KM = 30;

export async function geocodeAddress(address: string): Promise<{ lat: number; lon: number }> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=fr`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'NETTORIA-Pricing/1.0 (project.nettoria@gmail.com)' },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) throw new Error('Address not found');
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

async function getOrsDistance(
  fromLon: number, fromLat: number,
  toLon: number, toLat: number
): Promise<number> {
  if (!ORS_API_KEY) throw new Error('No ORS key');

  const body = JSON.stringify({
    coordinates: [[fromLon, fromLat], [toLon, toLat]],
  });

  // Try driving-car directly (reliable, covers all roads)
  const res = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: ORS_API_KEY,
    },
    body,
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`ORS HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const meters = data?.routes?.[0]?.summary?.distance;

  if (typeof meters !== 'number' || isNaN(meters) || meters <= 0) {
    throw new Error(`ORS returned invalid distance: ${meters}`);
  }

  return meters / 1000; // convert to km
}

export async function calculateDistance(
  destinationAddress: string
): Promise<{ km: number; estimated: boolean }> {
  try {
    const dest = await geocodeAddress(destinationAddress);
    const km = await getOrsDistance(DEPART_LON, DEPART_LAT, dest.lon, dest.lat);

    // Sanity check: cap at 500km, minimum 1km
    if (!isFinite(km) || km < 1 || km > 500) {
      console.warn(`ORS distance out of range: ${km}km — using fallback`);
      return { km: DEFAULT_DISTANCE_KM, estimated: true };
    }

    return { km: Math.round(km), estimated: false };
  } catch (err) {
    console.error('calculateDistance error:', err);
    return { km: DEFAULT_DISTANCE_KM, estimated: true };
  }
}
