import { NextRequest, NextResponse } from 'next/server';

const MAKE_WEBHOOK = 'https://hook.eu1.make.com/mm6rby9usqsxfescj5gvyej3f8jxsbce';

const PROPERTY_LABELS: Record<string, string> = {
  studio: 'Studio', t2: 'T2', t3: 'T3', t4plus: 'T4+',
  maison: 'Maison', bureau: 'Bureau', commerce: 'Commerce', cave: 'Cave / Grenier',
};

const FLOOR_LABELS: Record<string, string> = {
  rdc: 'Rez-de-chaussée', '1-2': '1er–2e étage', '3-4': '3e–4e étage', '5+': '5e étage et +',
};

const DEADLINE_LABELS: Record<string, string> = {
  flexible: 'Flexible', '10j': 'Sous 10 jours', '5j': 'Sous 5 jours', '48h': 'Urgence 48h',
};

const PARKING_LABELS: Record<string, string> = {
  direct: 'Accès direct', limite: 'Limité', impossible: 'Impossible',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientName, clientEmail, clientPhone, whatsapp, address, pdfBase64, formData, breakdown } = body;

    if (!clientName || !clientEmail || !pdfBase64) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, '');

    const webhookPayload = {
      submitted_at: new Date().toISOString(),
      client: {
        name: clientName,
        email: clientEmail,
        phone: clientPhone ?? '',
        whatsapp: whatsapp ?? false,
      },
      chantier: {
        address,
        property_type: formData ? PROPERTY_LABELS[formData.propertyType] ?? formData.propertyType : '',
        surface_m2: formData?.surface ?? null,
        floor: formData?.floor ? FLOOR_LABELS[formData.floor] ?? formData.floor : 'N/A',
        elevator: formData?.elevator ?? null,
        parking: formData?.parking ? PARKING_LABELS[formData.parking] ?? formData.parking : '',
        zfe: formData?.zfe ?? false,
        deadline: formData?.deadline ? DEADLINE_LABELS[formData.deadline] ?? formData.deadline : '',
        preferred_date: formData?.preferredDate ?? '',
        special_treatments: formData?.specialTreatments ?? [],
      },
      devis: {
        base_hours: breakdown?.baseHours ?? null,
        base_cost_ht: breakdown?.baseCost != null ? parseFloat(breakdown.baseCost.toFixed(2)) : null,
        majorations: breakdown?.majorations ?? [],
        distance_km: breakdown?.distanceKm ?? null,
        distance_estimated: breakdown?.distanceEstimated ?? false,
        frais_deplacement: breakdown?.totalDistanceCost != null ? parseFloat(breakdown.totalDistanceCost.toFixed(2)) : null,
        frais_services: breakdown ? parseFloat((breakdown.dechetterieForfix + breakdown.truckForfix + 50).toFixed(2)) : null,
        traitements_speciaux: breakdown?.specialTreatments ?? [],
        forfaits_fixes: breakdown?.fixedFees ?? [],
        subtotal_ht: breakdown?.subtotal != null ? parseFloat(breakdown.subtotal.toFixed(2)) : null,
        deadline_label: breakdown?.deadlineLabel ?? '',
        deadline_coeff: breakdown?.deadlineCoeff ?? 1,
        deadline_bonus: breakdown?.deadlineBonus != null ? parseFloat(breakdown.deadlineBonus.toFixed(2)) : null,
        total_ht: breakdown?.totalHT != null ? parseFloat(breakdown.totalHT.toFixed(2)) : null,
      },
      pdf_base64: base64Data,
    };

    const webhookRes = await fetch(MAKE_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookRes.ok) {
      console.error('Make webhook HTTP error:', webhookRes.status);
      return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
