const DEPART_LAT = 48.7262;
const DEPART_LON = 2.2484; // Palaiseau, 91120

const ORS_API_KEY = process.env.OPENROUTESERVICE_API_KEY || '';
const DEFAULT_DISTANCE_KM = 50;

export async function getRouteDistanceKm(
  destLat: number,
  destLon: number
): Promise<number> {
  if (!ORS_API_KEY) throw new Error('No ORS key configured');

  const res = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: ORS_API_KEY,
    },
    body: JSON.stringify({
      coordinates: [
        [DEPART_LON, DEPART_LAT],
        [destLon, destLat],
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`ORS HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const meters = data?.routes?.[0]?.summary?.distance;

  if (typeof meters !== 'number' || !isFinite(meters) || meters <= 0) {
    throw new Error(`ORS returned invalid distance: ${meters}`);
  }

  const km = meters / 1000;

  // Sanity cap: 1km min, 500km max
  if (km < 1 || km > 500) throw new Error(`Distance out of range: ${km}km`);

  return Math.round(km);
}

export { DEFAULT_DISTANCE_KM };
