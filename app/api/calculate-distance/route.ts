import { NextRequest, NextResponse } from 'next/server';
import { getRouteDistanceKm, DEFAULT_DISTANCE_KM } from '@/lib/distance';

export async function POST(req: NextRequest) {
  try {
    const { lat, lon } = await req.json();

    // lat/lon must be provided (sent from autocomplete selection)
    if (typeof lat !== 'number' || typeof lon !== 'number' || !isFinite(lat) || !isFinite(lon)) {
      return NextResponse.json({ km: DEFAULT_DISTANCE_KM, estimated: true });
    }

    const km = await getRouteDistanceKm(lat, lon);
    return NextResponse.json({ km, estimated: false });
  } catch (err) {
    console.error('calculate-distance error:', err);
    return NextResponse.json({ km: DEFAULT_DISTANCE_KM, estimated: true });
  }
}
