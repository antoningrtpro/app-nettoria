'use client';

import { useEffect, useState } from 'react';
import { QuoteDetail } from '@/components/ui/QuoteDetail';
import { calculatePricing } from '@/lib/pricing';
import type { QuoteFormData, PricingBreakdown } from '@/types/quote';

interface Props {
  formData: QuoteFormData;
  onNext: (breakdown: PricingBreakdown) => void;
  onBack: () => void;
}

export function Step3Quote({ formData, onNext, onBack }: Props) {
  const [breakdown, setBreakdown] = useState<PricingBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function compute() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/calculate-distance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: formData.address }),
        });
        const { km, estimated } = await res.json();
        setBreakdown(calculatePricing(formData, km, estimated));
      } catch {
        setBreakdown(calculatePricing(formData, 30, true));
      } finally {
        setIsLoading(false);
      }
    }
    compute();
  }, [formData]);

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-light text-gray-900 mb-1">Votre devis estimatif</h2>
        <p className="text-sm text-gray-400">{formData.address}</p>
      </div>

      <QuoteDetail breakdown={breakdown} isLoading={isLoading} />

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 border border-gray-200 text-gray-600 py-4 rounded-xl font-medium text-sm hover:border-gray-400 transition-colors"
        >
          Retour
        </button>
        <button
          type="button"
          onClick={() => breakdown && onNext(breakdown)}
          disabled={isLoading || !breakdown}
          className="flex-1 bg-gray-900 text-white py-4 rounded-xl font-medium text-sm tracking-wide hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Recevoir par mail
        </button>
      </div>
    </div>
  );
}
