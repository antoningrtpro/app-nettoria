import { NextRequest, NextResponse } from 'next/server';
import { getRouteDistanceKm, DEFAULT_DISTANCE_KM } from '@/lib/distance';

export async function POST(req: NextRequest) {
  try {
    const { lat, lon } = await req.json();

    // lat/lon must be provided and within metropolitan France
    if (typeof lat !== 'number' || typeof lon !== 'number' || !isFinite(lat) || !isFinite(lon)) {
      return NextResponse.json({ km: DEFAULT_DISTANCE_KM, estimated: true });
    }
    const isCorse = lat < 43.1 && lon > 8.4;
    if (lat < 42.3 || lat > 51.2 || lon < -5.2 || lon > 8.3 || isCorse) {
      return NextResponse.json({ error: 'Hors France métropolitaine' }, { status: 422 });
    }

    const km = await getRouteDistanceKm(lat, lon);
    return NextResponse.json({ km, estimated: false });
  } catch (err) {
    console.error('calculate-distance error:', err);
    return NextResponse.json({ km: DEFAULT_DISTANCE_KM, estimated: true });
  }
}
