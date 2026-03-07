import type {
  CalculatedQuote,
  CommissionItem,
  LineItem,
  Locale,
  PricingConfig,
  PricingItemConfig,
  QuoteInput
} from "@/lib/types";

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function findTier(config: PricingItemConfig, peopleCount: number) {
  return config.tiers.find((tier) => {
    const max = tier.maxPeople ?? Number.POSITIVE_INFINITY;
    return peopleCount >= tier.minPeople && peopleCount <= max;
  });
}

function buildPricingNotes(
  config: PricingItemConfig,
  tierLabel: string,
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
    return mult;
  }
  
  const model =
    config.pricingModel === "per_person"
      ? locale === "de"
        ? "pro Person"
        : "per person"
      : locale === "de"
        ? "pro Gruppe"
        : "per group";
  return `${tierLabel}, ${model}, ${mult}`;
}

function calculateItem(
  key: string,
  titleKey: string,
  quote: QuoteInput,
  config: PricingItemConfig,
  locale: Locale,
  options?: { daysOverride?: number; multLabelOverride?: string; skipModel?: boolean }
): LineItem {
  const tier = findTier(config, quote.peopleCount);
  if (!tier) {
    throw new Error(`No pricing tier for ${key} and ${quote.peopleCount} people`);
  }

  const peopleMultiplier = config.pricingModel === "per_person" ? quote.peopleCount : 1;
  const effectiveDays = options?.daysOverride ?? quote.days;
  const timeMultiplier = config.multiplier === "per_day" ? effectiveDays : 1;
  const qty = peopleMultiplier * timeMultiplier;
  const unitPrice = tier.price;
  const subtotal = roundCurrency(qty * unitPrice);
  const tierLabel = tier.maxPeople
    ? locale === "de"
      ? `Staffel ${tier.minPeople}-${tier.maxPeople} Personen`
      : `tier ${tier.minPeople}-${tier.maxPeople} people`
    : locale === "de"
      ? `Staffel ${tier.minPeople}+ Personen`
      : `tier ${tier.minPeople}+ people`;

  return {
    key,
    titleKey,
    qty,
    unitPrice: roundCurrency(unitPrice),
    subtotal,
    pricingNotes: buildPricingNotes(config, tierLabel, locale, options?.multLabelOverride, options?.skipModel)
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
  items.push(
    calculateItem(
      `hotel_${quote.hotelTier}`,
      `items.hotel_${quote.hotelTier}`,
      quote,
      hotelConfig,
      locale,
      {
        daysOverride: nights,
        multLabelOverride: locale === "de" ? "pro Nacht" : "per night",
        skipModel: true
      }
    )
  );

  if (quote.dinnerIncluded) {
    items.push(
      calculateItem("dinner", "items.dinner", quote, pricingConfig.dinner, locale)
    );
  }
  if (quote.guideIncluded) {
    const guideDays =
      pricingConfig.guide.multiplier === "per_day"
        ? Math.min(quote.days, Math.max(1, quote.guideDays || quote.days))
        : undefined;
    items.push(
      calculateItem("guide", "items.guide", quote, pricingConfig.guide, locale, {
        daysOverride: guideDays
      })
    );
  }
  if (quote.internationalFlight) {
    items.push(
      calculateItem("flight", "items.flight", quote, pricingConfig.flight, locale)
    );
  }

  quote.selectedExtras.forEach((selected) => {
    const extra = pricingConfig.extras.find((item) => item.id === selected.id);
    if (!extra) {
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
