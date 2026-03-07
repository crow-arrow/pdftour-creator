export type Locale = "en" | "de";
export type HotelTier = "budget" | "premium" | "luxury";
export type PricingModel = "per_person" | "per_group";
export type Multiplier = "per_day" | "per_trip" | "per_piece";

export interface Tier {
  minPeople: number;
  maxPeople: number | null;
  price: number;
}

export interface PricingItemConfig {
  pricingModel: PricingModel;
  multiplier: Multiplier;
  tiers: Tier[];
}

export interface PricingConfig {
  hotel: Record<HotelTier, PricingItemConfig>;
  dinner: PricingItemConfig;
  guide: PricingItemConfig;
  flight: PricingItemConfig;
  coverageMaxPeople: number;
  extras: PricingExtra[];
}

export interface QuoteInput {
  clientName: string;
  quoteNumber: string;
  date: string;
  peopleCount: number;
  days: number;
  hotelTier: HotelTier;
  dinnerIncluded: boolean;
  guideIncluded: boolean;
  guideDays: number;
  internationalFlight: boolean;
  localAgencyCommissionPct: number;
  jinnCommissionPct: number;
  selectedExtras: SelectedExtra[];
}

export interface SelectedExtra {
  id: string;
  days: number;
  quantity: number;
}

export interface PricingExtra {
  id: string;
  titleEn: string;
  titleDe: string;
  price: number;
  pricingModel: PricingModel;
  multiplier: Multiplier;
}

export interface LineItem {
  key: string;
  titleKey?: string;
  title?: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
  pricingNotes: string;
}

export interface CalculatedQuote {
  items: LineItem[];
  baseTotal: number;
  commissionItems: CommissionItem[];
  commissionTotal: number;
  total: number;
}

export interface CommissionItem {
  key: string;
  titleKey: string;
  ratePct: number;
  amount: number;
}
