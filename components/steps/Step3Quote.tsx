'use client';

import { useEffect, useState, useRef } from 'react';
import { QuoteDetail } from '@/components/ui/QuoteDetail';
import { calculatePricing } from '@/lib/pricing';
import { generateQuotePDF } from '@/lib/pdf-generator';
import type { QuoteFormData, PricingBreakdown, ContactData } from '@/types/quote';

interface Props {
  formData: QuoteFormData;
  contactData: ContactData;
  onBack: () => void;
}

export function Step3Quote({ formData, contactData, onBack }: Props) {
  const [breakdown, setBreakdown] = useState<PricingBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [webhookSent, setWebhookSent] = useState(false);
  const sentRef = useRef(false);

  useEffect(() => {
    async function compute() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/calculate-distance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: formData.addressLat, lon: formData.addressLon }),
        });
        const json = await res.json();
        const km = (typeof json.km === 'number' && isFinite(json.km) && json.km > 0) ? json.km : 50;
        const estimated = json.estimated ?? true;
        setBreakdown(calculatePricing(formData, km, estimated));
      } catch {
        setBreakdown(calculatePricing(formData, 50, true));
      } finally {
        setIsLoading(false);
      }
    }
    compute();
  }, [formData]);

  // Auto-fire webhook once breakdown is ready
  useEffect(() => {
    if (!breakdown || sentRef.current) return;
    sentRef.current = true;

    async function sendWebhook() {
      try {
        const phone = `${contactData.dialCode} ${contactData.phoneNumber}`.trim();
        const pdfBase64 = await generateQuotePDF(formData, breakdown!, contactData.clientName, contactData.clientEmail);

        await fetch('/api/send-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientName: contactData.clientName,
            clientEmail: contactData.clientEmail,
            clientPhone: phone,
            whatsapp: contactData.whatsapp,
            address: formData.address,
            pdfBase64,
            formData,
            breakdown,
          }),
        });
        setWebhookSent(true);
      } catch {
        // silent fail — devis still shown
        setWebhookSent(true);
      }
    }
    sendWebhook();
  }, [breakdown, contactData, formData]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-light text-gray-900 mb-1">Votre devis estimatif</h2>
        <p className="text-sm text-gray-400">{formData.address}</p>
      </div>

      <QuoteDetail breakdown={breakdown} isLoading={isLoading} />

      {breakdown && (
        <div className="bg-gray-50 rounded-2xl border border-gray-100 px-6 py-5 space-y-1">
          <p className="text-xs text-gray-400 uppercase tracking-widest">Récapitulatif envoi</p>
          <p className="text-sm text-gray-600">{contactData.clientName} · {contactData.clientEmail}</p>
          {webhookSent ? (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Devis transmis · valable 10 jours
            </p>
          ) : (
            <p className="text-xs text-gray-400">Envoi en cours…</p>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center leading-relaxed">
        Pour valider ce devis, veuillez directement répondre au mail reçu à l'instant<br />
        (pensez à vérifier vos SPAM).
      </p>
    </div>
  );
}
