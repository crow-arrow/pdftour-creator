export type FontHeading =
  | "Playfair Display"
  | "Cormorant Garamond"
  | "Lora"
  | "Merriweather"
  | "Aboreto"
  | "Cinzel"
  | "Raleway"
  | "Bebas Neue";
export type FontBody =
  | "Inter"
  | "Montserrat"
  | "Source Sans 3"
  | "Open Sans"
  | "Raleway"
  | "Lato"
  | "Nunito";
export type FontCoverTitle = FontHeading;

/** Max chars per day description so 3 days fit on one A4 page */
export const MAX_DAY_DESCRIPTION_CHARS = 700;

export interface TourBuilderColors {
  accent: string;
  text: string;
  footer: string;
}

export interface TourBuilderFonts {
  heading: FontHeading;
  body: FontBody;
}

export interface DayAdditionalInfo {
  label: string;
  value: string;
}

export interface ItineraryDay {
  id: string;
  date: string;
  title: string;
  meals: string;
  description: string;
  imageUrl: string;
  location?: string;
  /** Гибкая секция: Meals, Location, Actions и т.д. Если задана — используется вместо meals/location */
  additionalInfo?: DayAdditionalInfo[];
}

export interface TourOverview {
  title: string;
  subtitle: string;
  dates: string;
  extensionNote?: string;
  welcomeText: string;
}

export interface TourInclusions {
  included: string[];
  excluded: string[];
  highlights: string[];
}

export interface TourManager {
  enabled: boolean;
  name: string;
  bio: string;
  avatarUrl?: string;
}

export interface TourPrice {
  mainTitle: string;
  mainPrice: string;
  mainSingleSupplement: string;
  extensionTitle?: string;
  extensionPrice?: string;
  extensionSingleSupplement?: string;
  currencyNote: string;
  additionalNotes: string;
  discountNote?: string;
}

export type CoverTitleStyle = "normal" | "uppercase" | "lowercase";
export type CoverTitleWeight = "400" | "600" | "700";

export interface TourBuilderState {
  colors: TourBuilderColors;
  fonts: TourBuilderFonts;
  cover: {
    title: string;
    subtitle: string;
    backgroundImageUrl: string;
    logoUrl?: string;
    titleFont?: FontCoverTitle;
    titleColor?: string;
    titleStyle?: CoverTitleStyle;
    titleWeight?: CoverTitleWeight;
    titleLetterSpacing?: "normal" | "wide" | "extra-wide";
  };
  overview: TourOverview;
  inclusions: TourInclusions;
  tourManager: TourManager;
  price: TourPrice;
  itinerary: ItineraryDay[];
  optionalExtension?: {
    enabled?: boolean;
    title: string;
    intro: string;
    days: ItineraryDay[];
  };
  contact: {
    phone: string;
    email: string;
    website: string;
  };
}
