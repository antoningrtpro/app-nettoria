import { NextRequest, NextResponse } from 'next/server';
import { calculateDistance } from '@/lib/distance';

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();
    if (!address) return NextResponse.json({ error: 'Missing address' }, { status: 400 });
    const result = await calculateDistance(address);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ km: 30, estimated: true });
  }
}
