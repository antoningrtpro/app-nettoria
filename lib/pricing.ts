import type { QuoteFormData, PricingBreakdown, PropertyType } from '@/types/quote';

// Always use tres_dense — encombrement n'est plus demandé
const HEURES_BASE: Record<PropertyType, number> = {
  studio:   7,
  t2:       9,
  t3:       12,
  t4plus:   16,
  maison:   18,
  bureau:   11,
  commerce: 12,
  cave:     5,
};

const TAUX_HORAIRE = 55;
const FORFAIT_DECHETTERIE = 100;
const FORFAIT_CAMION = 100;
const PRIX_CARBURANT = 2.2;
const CONSO_L_100 = 15;
const FRAIS_USURE_KM = 0.35;
const DETOUR_DECHETTERIE_KM = 20;

const SPECIAL_TREATMENTS: Record<string, { label: string; amount: number }> = {
  amiante:        { label: 'Traitement amiante', amount: 300 },
  electromenager: { label: 'Électroménager', amount: 50 },
  peintures:      { label: 'Peintures & solvants', amount: 80 },
  batteries:      { label: 'Batteries', amount: 40 },
  medicaments:    { label: 'Médicaments', amount: 30 },
};

const DEADLINE_COEFFS: Record<string, { coeff: number; label: string }> = {
  flexible: { coeff: 1.0,  label: 'Flexible' },
  '10j':    { coeff: 1.1,  label: 'Sous 10 jours' },
  '5j':     { coeff: 1.25, label: 'Sous 5 jours' },
  '48h':    { coeff: 1.45, label: 'Urgence 48h' },
};

export function calculatePricing(
  data: QuoteFormData,
  distanceKm: number,
  distanceEstimated: boolean
): PricingBreakdown {
  const baseHours = HEURES_BASE[data.propertyType];
  const baseCost = baseHours * TAUX_HORAIRE;

  const majorations: { label: string; percent: number; amount: number }[] = [];
  let coeffSum = 0;

  // Étage
  const floor = data.floor;
  const hasElevator = data.elevator;
  if (floor && floor !== 'rdc') {
    if (!hasElevator) {
      if (floor === '1-2') { coeffSum += 0.10; majorations.push({ label: 'Étage 1–2 (sans ascenseur)', percent: 10, amount: 0 }); }
      else if (floor === '3-4') { coeffSum += 0.20; majorations.push({ label: 'Étage 3–4 (sans ascenseur)', percent: 20, amount: 0 }); }
      else if (floor === '5+') { coeffSum += 0.35; majorations.push({ label: 'Étage 5+ (sans ascenseur)', percent: 35, amount: 0 }); }
    } else {
      if (floor === '3-4') { coeffSum += 0.05; majorations.push({ label: 'Étage 3–4 (avec ascenseur)', percent: 5, amount: 0 }); }
      else if (floor === '5+') { coeffSum += 0.10; majorations.push({ label: 'Étage 5+ (avec ascenseur)', percent: 10, amount: 0 }); }
    }
  }

  // Stationnement
  if (data.parking === 'limite')    { coeffSum += 0.10; majorations.push({ label: 'Stationnement limité', percent: 10, amount: 0 }); }
  if (data.parking === 'impossible') { coeffSum += 0.25; majorations.push({ label: 'Stationnement impossible', percent: 25, amount: 0 }); }

  const coeffTotal = 1 + coeffSum;
  const majoratedBase = baseCost * coeffTotal;

  majorations.forEach((m) => { m.amount = baseCost * (m.percent / 100); });

  // Distance
  const totalDistanceKm = distanceKm * 2 + DETOUR_DECHETTERIE_KM;
  const fuelCost = (totalDistanceKm / 100) * CONSO_L_100 * PRIX_CARBURANT;
  const wearCost = totalDistanceKm * FRAIS_USURE_KM;
  const totalDistanceCost = fuelCost + wearCost;

  // Forfaits fixes
  const fixedFees: { label: string; amount: number }[] = [];
  if (data.zfe) fixedFees.push({ label: 'Zone piétonne / ZFE', amount: 80 });
  // Nettoyage léger toujours inclus
  fixedFees.push({ label: 'Nettoyage fin de chantier (inclus)', amount: 50 });
  const fixedFeesTotal = fixedFees.reduce((s, f) => s + f.amount, 0);

  // Traitements spéciaux
  const specialTreatmentItems: { label: string; amount: number }[] = [];
  for (const key of data.specialTreatments) {
    if (SPECIAL_TREATMENTS[key]) specialTreatmentItems.push(SPECIAL_TREATMENTS[key]);
  }
  const specialTreatmentsTotal = specialTreatmentItems.reduce((s, t) => s + t.amount, 0);

  const subtotal =
    majoratedBase +
    totalDistanceCost +
    FORFAIT_DECHETTERIE +
    FORFAIT_CAMION +
    fixedFeesTotal +
    specialTreatmentsTotal;

  const { coeff: deadlineCoeff, label: deadlineLabel } = DEADLINE_COEFFS[data.deadline] ?? { coeff: 1, label: 'Flexible' };
  const deadlineBonus = subtotal * (deadlineCoeff - 1);
  const totalHT = subtotal * deadlineCoeff;

  return {
    baseHours,
    baseCost,
    majorations,
    majoratedBase,
    distanceKm,
    fuelCost,
    wearCost,
    totalDistanceCost,
    dechetterieForfix: FORFAIT_DECHETTERIE,
    truckForfix: FORFAIT_CAMION,
    specialTreatments: specialTreatmentItems,
    specialTreatmentsTotal,
    fixedFees,
    fixedFeesTotal,
    subtotal,
    deadlineCoeff,
    deadlineLabel,
    deadlineBonus,
    totalHT,
    distanceEstimated,
  };
}
