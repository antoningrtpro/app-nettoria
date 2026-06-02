'use client';

import type { PricingBreakdown } from '@/types/quote';

function Row({
  label,
  value,
  muted,
  indent,
  green,
}: {
  label: string;
  value: string;
  muted?: boolean;
  indent?: boolean;
  green?: boolean;
}) {
  return (
    <div className={`flex justify-between items-center py-3.5 border-b border-gray-100 last:border-0 ${indent ? 'pl-5' : ''}`}>
      <span className={`text-sm ${muted ? 'text-gray-400' : 'text-gray-700'}`}>{label}</span>
      <span className={`tabular-nums text-sm font-medium ${green ? 'text-emerald-600' : muted ? 'text-gray-400' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  );
}

export function QuoteDetail({
  breakdown,
  isLoading,
}: {
  breakdown: PricingBreakdown | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        <span className="text-sm text-gray-400">Calcul du trajet en cours…</span>
      </div>
    );
  }

  if (!breakdown) return null;

  const fmt = (n: number) => `${n.toFixed(2)} €`;
  const fmtPlus = (n: number) => `+${n.toFixed(2)} €`;

  // Frais de services = déchetterie + camion + nettoyage (50€ inclus dans le total, affiché GRATUIT)
  const nettoyageFee = breakdown.fixedFees.find((f) => f.label.includes('Nettoyage'));
  const fraisServices = breakdown.dechetterieForfix + breakdown.truckForfix + (nettoyageFee?.amount ?? 0);
  // Other fixed fees (ZFE, etc.) — exclude nettoyage
  const otherFixedFees = breakdown.fixedFees.filter((f) => !f.label.includes('Nettoyage'));
  const fmt2 = fmt;

  return (
    <div className="animate-slide-up space-y-5">
      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {breakdown.deadlineCoeff === 1.45 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-medium border border-red-100">
            ⚡ Urgence 48h
          </span>
        )}
        {otherFixedFees.some((f) => f.label.includes('ZFE')) && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium border border-blue-100">
            ZFE active
          </span>
        )}
        {breakdown.distanceEstimated && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-100">
            Distance estimée
          </span>
        )}
      </div>

      {/* Detail block */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

        {/* Prestations */}
        <div className="px-6 pt-6 pb-1">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Prestations</p>
          <Row label="Forfait débarras" value={fmt(breakdown.baseCost)} />
          {breakdown.majorations.map((m, i) => (
            <Row key={i} label={`${m.label}`} value={fmtPlus(m.amount)} muted indent />
          ))}
          {breakdown.majorations.length > 0 && (
            <Row label="Sous-total main-d'œuvre" value={fmt(breakdown.majoratedBase)} />
          )}
        </div>

        {/* Déplacement */}
        <div className="px-6 py-1 border-t border-gray-100">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3 mt-3">Déplacement</p>
          <Row label="Frais de déplacement" value={fmt(breakdown.totalDistanceCost)} />
          <Row label="dont carburant" value={fmt(breakdown.fuelCost)} muted indent />
          <Row label="dont usure véhicule" value={fmt(breakdown.wearCost)} muted indent />
        </div>

        {/* Frais de services */}
        <div className="px-6 py-1 border-t border-gray-100">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3 mt-3">Frais de services</p>
          <Row label="Frais de services" value={fmt2(fraisServices)} />
          <Row label="Nettoyage fin de chantier" value="GRATUIT" green />
        </div>

        {/* Traitements spéciaux */}
        {(breakdown.specialTreatments.length > 0 || otherFixedFees.length > 0) && (
          <div className="px-6 py-1 border-t border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3 mt-3">Suppléments</p>
            {otherFixedFees.map((f, i) => (
              <Row key={i} label={f.label} value={fmtPlus(f.amount)} />
            ))}
            {breakdown.specialTreatments.map((t, i) => (
              <Row key={i} label={t.label} value={fmtPlus(t.amount)} />
            ))}
          </div>
        )}

        {/* Sous-total & délai */}
        <div className="px-6 py-1 border-t border-gray-100">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3 mt-3">Récapitulatif</p>
          <Row label="Sous-total HT" value={fmt(breakdown.subtotal)} />
          {breakdown.deadlineCoeff > 1 && (
            <Row
              label={`Délai "${breakdown.deadlineLabel}" (×${breakdown.deadlineCoeff})`}
              value={fmtPlus(breakdown.deadlineBonus)}
            />
          )}
        </div>

        {/* Total */}
        <div className="px-6 py-5 bg-[#0EA5E9] flex justify-between items-end">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Total estimé HT</p>
            <p className="text-xs text-gray-500">TVA non applicable — art. 293B CGI</p>
          </div>
          <span className="text-4xl font-light text-white tabular-nums">
            {breakdown.totalHT.toFixed(2)} <span className="text-xl text-gray-400">€</span>
          </span>
        </div>
      </div>
    </div>
  );
}
