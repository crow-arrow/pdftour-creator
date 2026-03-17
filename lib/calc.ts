import type {
  CalculatedQuote,
  CommissionItem,
  LineItem,
  Locale,
  PricingConfig,
  HotelPricingConfig,
  SimplePricingConfig,
  QuoteInput
} from "@/lib/types";

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function buildPricingNotes(
  config: SimplePricingConfig | HotelPricingConfig,
  extraLabel: string,
  locale: Locale,
  multOverride?: string,
  skipModel?: boolean
) {
  const mult =
    multOverride ??
    (config.multiplier === "per_day"
      ? locale === "de"
        ? "pro Tag"
        : "per day"
      : config.multiplier === "per_trip"
        ? locale === "de"
          ? "pro Reise"
          : "per trip"
        : locale === "de"
          ? "pro Stück"
          : "per piece");

  if (skipModel) {
    return extraLabel ? `${extraLabel}, ${mult}` : mult;
  }

  const model =
    config.pricingModel === "per_person"
      ? locale === "de"
        ? "pro Person"
        : "per person"
      : locale === "de"
        ? "pro Gruppe"
        : "per group";
  return extraLabel ? `${extraLabel}, ${model}, ${mult}` : `${model}, ${mult}`;
}

function calculateSimpleItem(
  key: string,
  titleKey: string,
  quote: QuoteInput,
  config: SimplePricingConfig,
  locale: Locale,
  options?: { daysOverride?: number; multLabelOverride?: string }
): LineItem {
  const peopleMultiplier = config.pricingModel === "per_person" ? quote.peopleCount : 1;
  const effectiveDays = options?.daysOverride ?? quote.days;
  const timeMultiplier = config.multiplier === "per_day" ? effectiveDays : 1;
  const qty = peopleMultiplier * timeMultiplier;
  const unitPrice = config.price;
  const subtotal = roundCurrency(qty * unitPrice);

  return {
    key,
    titleKey,
    qty,
    unitPrice: roundCurrency(unitPrice),
    subtotal,
    pricingNotes: buildPricingNotes(config, "", locale, options?.multLabelOverride)
  };
}

export function calculateQuote(
  quote: QuoteInput,
  pricingConfig: PricingConfig,
  locale: Locale = "en"
): CalculatedQuote {
  if (quote.peopleCount < 1 || quote.days < 1) {
    throw new Error("People count and days must be >= 1");
  }

  const items: LineItem[] = [];
  const hotelConfig = pricingConfig.hotel[quote.hotelTier];
  const nights = Math.max(0, quote.days - 1);

  // Hotel base: all people × basePrice × nights
  const hotelBaseQty = quote.peopleCount * nights;
  const hotelBaseSubtotal = roundCurrency(hotelBaseQty * hotelConfig.basePrice);
  items.push({
    key: `hotel_${quote.hotelTier}`,
    titleKey: `items.hotel_${quote.hotelTier}`,
    qty: hotelBaseQty,
    unitPrice: roundCurrency(hotelConfig.basePrice),
    subtotal: hotelBaseSubtotal,
    pricingNotes: buildPricingNotes(
      hotelConfig,
      "",
      locale,
      locale === "de" ? "pro Nacht" : "per night",
      true
    )
  });

  quote.selectedExtras.forEach((selected) => {
    const extra = pricingConfig.extras.find((item) => item.id === selected.id);
    if (!extra) {
      return;
    }

    if (selected.id === "single_supplement") {
      const price = hotelConfig.singleSupplementPrice;
      const count = Math.max(0, Math.min(selected.quantity ?? 0, quote.peopleCount));
      const qty = count * nights;
      const title = locale === "de" ? extra.titleDe : extra.titleEn;
      items.push({
        key: `extra_${extra.id}`,
        title,
        qty,
        unitPrice: roundCurrency(price),
        subtotal: roundCurrency(qty * price),
        pricingNotes: locale === "de" ? "pro Nacht" : "per night"
      })
      return;
    }

    const title = locale === "de" ? extra.titleDe : extra.titleEn;
    const model =
      extra.pricingModel === "per_person"
        ? locale === "de"
          ? "pro Person"
          : "per person"
        : locale === "de"
          ? "pro Gruppe"
          : "per group";
    const mult =
      extra.multiplier === "per_day"
        ? locale === "de"
          ? "pro Tag"
          : "per day"
        : extra.multiplier === "per_trip"
          ? locale === "de"
            ? "pro Reise"
            : "per trip"
          : locale === "de"
            ? "pro Stück"
            : "per piece";
    const note = `${model}, ${mult}`;
    const qtyPeople = extra.pricingModel === "per_person" ? quote.peopleCount : 1;
    const days = Math.max(1, selected.days || quote.days);
    const qtyTime =
      extra.multiplier === "per_day"
        ? days
        : extra.multiplier === "per_piece"
          ? Math.max(1, selected.quantity || 1)
          : 1;
    const qty = qtyPeople * qtyTime;
    const subtotal = roundCurrency(extra.price * qty);
    items.push({
      key: `extra_${extra.id}`,
      title,
      qty,
      unitPrice: roundCurrency(extra.price),
      subtotal,
      pricingNotes: note
    });
  });

  const baseTotal = roundCurrency(items.reduce((sum, item) => sum + item.subtotal, 0));
  const localPct = Math.max(0, quote.localAgencyCommissionPct || 0);
  const jinnPct = Math.max(0, quote.jinnCommissionPct || 0);
  const commissionItems: CommissionItem[] = [];

  if (localPct > 0) {
    commissionItems.push({
      key: "commission_local_agency",
      titleKey: "labels.localAgencyCommission",
      ratePct: localPct,
      amount: roundCurrency(baseTotal * (localPct / 100))
    });
  }
  if (jinnPct > 0) {
    commissionItems.push({
      key: "commission_jinn",
      titleKey: "labels.jinnCommission",
      ratePct: jinnPct,
      amount: roundCurrency(baseTotal * (jinnPct / 100))
    });
  }

  const commissionTotal = roundCurrency(
    commissionItems.reduce((sum, item) => sum + item.amount, 0)
  );
  const total = roundCurrency(baseTotal + commissionTotal);
  return { items, baseTotal, commissionItems, commissionTotal, total };
}
