import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'project.nettoria@gmail.com';
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

    // Build email HTML
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #111; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 400; letter-spacing: 2px;">NETTORIA</h1>
          <p style="color: #aaa; margin: 4px 0 0; font-size: 12px;">Spécialiste du débarras</p>
        </div>
        <div style="background-color: #fafafa; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #e8e8e8; border-top: none;">
          <p style="font-size: 16px; color: #333;">Bonjour <strong>${clientName}</strong>,</p>
          <p style="color: #555; line-height: 1.7;">
            Nous avons bien reçu votre demande de devis pour le débarras situé à
            <strong>${address}</strong>.
          </p>
          <p style="color: #555; line-height: 1.7;">
            Votre devis détaillé est joint à ce message. Il est valable <strong>10 jours</strong>
            à compter de la date d'émission.
          </p>
          <p style="color: #555; line-height: 1.7;">
            Pour accepter ce devis ou toute question, répondez directement à cet e-mail.
          </p>
          <div style="border: 1px solid #e8e8e8; border-radius: 8px; padding: 16px; margin: 24px 0; background: white;">
            <p style="margin: 0 0 8px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #aaa;">Prochaines étapes</p>
            <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6;">
              Répondez à cet e-mail pour confirmer votre intervention.<br>
              Un acompte de 30 % vous sera demandé à la commande.
            </p>
          </div>
          <p style="color: #555; margin-bottom: 4px;">Cordialement,</p>
          <p style="color: #111; font-weight: 600; margin: 0;">L'équipe NETTORIA</p>
        </div>
        <p style="text-align: center; color: #bbb; font-size: 11px; margin-top: 16px;">
          NETTORIA — ${FROM}
        </p>
      </div>
    `;

    // Build webhook payload
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

    // Fire email + webhook in parallel
    const [emailResult, webhookResult] = await Promise.allSettled([
      resend.emails.send({
        from: `NETTORIA <onboarding@resend.dev>`,
        to: clientEmail,
        replyTo: FROM,
        subject: `Votre devis NETTORIA – ${address}`,
        html,
        attachments: [{ filename: 'devis-nettoria.pdf', content: base64Data }],
      }),
      fetch(MAKE_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      }),
    ]);

    // Log webhook status but don't fail if webhook fails
    if (webhookResult.status === 'rejected') {
      console.error('Make webhook error:', webhookResult.reason);
    } else if (webhookResult.status === 'fulfilled' && !webhookResult.value.ok) {
      console.error('Make webhook HTTP error:', webhookResult.value.status);
    }

    if (emailResult.status === 'rejected' || emailResult.value?.error) {
      const err = emailResult.status === 'rejected' ? emailResult.reason : emailResult.value.error;
      console.error('Resend error:', err);
      return NextResponse.json({ error: 'Email send failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
