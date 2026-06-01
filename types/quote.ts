export type PropertyType =
  | 'studio'
  | 't2'
  | 't3'
  | 't4plus'
  | 'maison'
  | 'bureau'
  | 'commerce'
  | 'cave';

export type Floor = 'rdc' | '1-2' | '3-4' | '5+';
export type ParkingType = 'direct' | 'limite' | 'impossible';
export type Deadline = 'flexible' | '10j' | '5j' | '48h';

export interface Step1Data {
  address: string;
  propertyType: PropertyType;
  surface: number;
  floor?: Floor;
  elevator?: boolean;
}

export interface Step2Data {
  parking: ParkingType;
  zfe: boolean;
  deadline: Deadline;
  preferredDate?: string;
  specialTreatments: string[];
  insalubrite: boolean;
}

export interface QuoteFormData extends Step1Data, Step2Data {}

export interface PricingBreakdown {
  baseHours: number;
  baseCost: number;
  majorations: { label: string; percent: number; amount: number }[];
  majoratedBase: number;
  distanceKm: number;
  fuelCost: number;
  wearCost: number;
  totalDistanceCost: number;
  dechetterieForfix: number;
  truckForfix: number;
  specialTreatments: { label: string; amount: number }[];
  specialTreatmentsTotal: number;
  fixedFees: { label: string; amount: number }[];
  fixedFeesTotal: number;
  subtotal: number;
  deadlineCoeff: number;
  deadlineLabel: string;
  deadlineBonus: number;
  totalHT: number;
  distanceEstimated: boolean;
}
