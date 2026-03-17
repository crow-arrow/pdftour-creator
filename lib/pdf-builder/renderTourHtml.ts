import type { TourBuilderState } from "./types";
import { MAX_DAY_DESCRIPTION_CHARS } from "./types";
import type { Locale } from "@/lib/types";
import { dictionaries } from "@/lib/i18n";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function nl2br(text: string) {
  return text.split("\n").join("<br />");
}

export function renderTourHtml(state: TourBuilderState, locale: Locale = "en"): string {
  const t = (key: keyof (typeof dictionaries)["en"]) => dictionaries[locale][key];
  const {
    colors,
    fonts,
    cover,
    overview,
    inclusions,
    tourManager,
    price,
    itinerary,
    optionalExtension,
    contact
  } = state;

  const contactLine = `${escapeHtml(contact.phone)} | ${escapeHtml(contact.email)} | ${escapeHtml(contact.website)}`;
  const footerColor = colors.footer ?? "#334155";
  const fontHeading = fonts.heading.replace(/ /g, "+");
  const fontBody = fonts.body.replace(/ /g, "+");
  const coverFont = (cover.titleFont ?? fonts.heading).replace(/ /g, "+");
  const fontUrl = `https://fonts.googleapis.com/css2?family=${fontHeading}:wght@400;500;600;700&family=${fontBody}:wght@400;500;600;700&family=${coverFont}:wght@400;600;700&display=swap`;
  const showTourManager = tourManager.enabled !== false;

  const renderItineraryDay = (day: (typeof itinerary)[0]) => `
    <div class="itinerary-day">
      <div class="itinerary-day-card">
        ${
          day.imageUrl
            ? `<div class="itinerary-day-img" style="background-image: url(${escapeHtml(day.imageUrl)});"></div>`
            : ""
        }
        <div class="itinerary-day-body">
          <div style="font-family: '${fonts.heading}', serif; font-size: 14px; font-weight: 600; margin-bottom: 4px;">
            ${escapeHtml(day.date)}
          </div>
          <div style="font-size: 16px; font-weight: 600; margin-bottom: 6px;">
            ${escapeHtml(day.title)}
          </div>
          ${
            (day.additionalInfo && day.additionalInfo.length > 0
              ? day.additionalInfo.filter((a) => a.label.trim() || a.value.trim())
              : [
                  ...(day.meals ? [{ label: t("pdfBuilder.meals"), value: day.meals }] : []),
                  ...(day.location ? [{ label: t("pdfBuilder.location"), value: day.location }] : [])
                ]
            )
              .map(
                (a) =>
                  `<div style="font-size: 11px; color: #64748b; margin-bottom: 2px;">${escapeHtml(a.label)}: ${escapeHtml(a.value)}</div>`
              )
              .join("")
          }
        </div>
      </div>
      <div style="font-size: 13px; line-height: 1.55;">${escapeHtml(day.description.slice(0, MAX_DAY_DESCRIPTION_CHARS))}</div>
    </div>
  `;

  const DAYS_PER_PAGE = 3;
  const itineraryPages = Array.from(
    { length: Math.ceil(itinerary.length / DAYS_PER_PAGE) },
    (_, i) => itinerary.slice(i * DAYS_PER_PAGE, i * DAYS_PER_PAGE + DAYS_PER_PAGE)
  );

  const extensionPages =
    optionalExtension &&
    optionalExtension.enabled !== false &&
    Array.from(
      { length: Math.ceil(optionalExtension.days.length / DAYS_PER_PAGE) },
      (_, i) =>
        optionalExtension.days.slice(i * DAYS_PER_PAGE, i * DAYS_PER_PAGE + DAYS_PER_PAGE)
    );

  const extensionHtml =
    extensionPages &&
    extensionPages
      .map(
        (days, pageIndex) => `
    <div class="page">
      <div class="page-content">
      <div class="section-title" style="color: ${colors.accent}; font-weight: 600;">
        ${escapeHtml(optionalExtension!.title)}
      </div>
      ${pageIndex === 0 ? `<div style="font-size: 11px; line-height: 1.55; margin-bottom: 16px;">${escapeHtml(optionalExtension!.intro)}</div>` : ""}
      <div style="display: flex; flex-direction: column; gap: 20px;">
        ${days
          .map(
            (day) => `
          <div class="itinerary-day">
            <div style="font-family: '${fonts.heading}', serif; font-size: 12px; font-weight: 600; margin-bottom: 2px;">
              ${escapeHtml(day.date)}
            </div>
            <div style="font-size: 13px; font-weight: 600; margin-bottom: 6px;">
              ${escapeHtml(day.title)}
            </div>
            <div style="font-size: 11px; line-height: 1.5;">${escapeHtml(day.description.slice(0, MAX_DAY_DESCRIPTION_CHARS))}</div>
          </div>
        `
          )
          .join("")}
      </div>
      </div>
      <div class="page-footer" style="background-color: ${footerColor};">${contactLine}</div>
    </div>
    `
      )
      .join("");

  const tourManagerHtml =
    showTourManager &&
    `
    <div class="page">
      <div class="page-content">
      <div style="display: flex; gap: 24px; align-items: flex-start;">
        ${
          tourManager.avatarUrl
            ? `<div style="width: 120px; height: 120px; min-width: 120px; border-radius: 50%; background-image: url(${escapeHtml(tourManager.avatarUrl)}); background-size: cover; background-position: center;"></div>`
            : ""
        }
        <div style="flex: 1; min-width: 0;">
          <div class="section-title" style="color: ${colors.accent}; font-weight: 600;">TOUR MANAGER: ${escapeHtml(tourManager.name)}</div>
          <div style="font-size: 11px; line-height: 1.55;">${nl2br(escapeHtml(tourManager.bio))}</div>
        </div>
      </div>
      </div>
      <div class="page-footer" style="background-color: ${footerColor};">${contactLine}</div>
    </div>
  `;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="${fontUrl}" />
    <style>
      @page { size: A4; margin: 0; }
      * { box-sizing: border-box; }
      body { margin: 0; padding: 0; font-family: "${fonts.body}", sans-serif; color: ${colors.text}; background: #fff; }
      .page { display: flex; flex-direction: column; padding: 32px 40px 0; page-break-after: always; min-height: 297mm; }
      .page:last-child { page-break-after: auto; }
      .page-content { flex: 1; min-height: 0; }
      .page-footer { margin-top: auto; margin-left: -40px; margin-right: -40px; padding: 12px 40px 24px; font-size: 10px; color: rgba(255,255,255,0.95); }
      .cover { position: relative; height: 297mm; min-height: 297mm; display: flex; flex-direction: column; justify-content: flex-end; padding: 40px 48px; background-size: cover; background-position: center; }
      .cover-logo { position: absolute; top: 24px; left: 24px; max-width: 120px; max-height: 60px; object-fit: contain; }
      .section-title { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 10px; }
      .bullet { margin-bottom: 4px; padding-left: 14px; position: relative; font-size: 11px; line-height: 1.4; }
      .bullet::before { content: "•"; position: absolute; left: 0; }
      .itinerary-grid { display: flex; flex-direction: column; gap: 28px; }
      .itinerary-day { break-inside: avoid; page-break-inside: avoid; }
      .itinerary-day-card { display: flex; gap: 16px; margin-bottom: 10px; }
      .itinerary-day-img { width: 220px; min-width: 220px; height: 165px; background-size: cover; background-position: center; border-radius: 8px; }
      .itinerary-day-body { flex: 1; min-width: 0; }
      .inclusions-exclusions-block { break-inside: avoid; }
    </style>
  </head>
  <body>
    <div class="cover" style="background-image: url(${escapeHtml(cover.backgroundImageUrl)})">
      ${cover.logoUrl ? `<img class="cover-logo" src="${escapeHtml(cover.logoUrl)}" alt="Logo" />` : ""}
      <h1 style="font-family: '${cover.titleFont ?? fonts.heading}', serif; font-size: 48px; font-weight: ${cover.titleWeight ?? "700"}; color: ${cover.titleColor ?? "#fff"}; text-transform: ${cover.titleStyle ?? "uppercase"}; letter-spacing: ${cover.titleLetterSpacing === "wide" ? "0.12em" : cover.titleLetterSpacing === "extra-wide" ? "0.2em" : "normal"}; margin: 0 0 8px 0;">
        ${escapeHtml(cover.title)}
      </h1>
      <div style="font-size: 20px; color: rgba(255,255,255,0.95); letter-spacing: 0.05em;">
        ${escapeHtml(cover.subtitle)}
      </div>
    </div>

    <div class="page">
      <div class="page-content">
      <div style="border-bottom: 2px solid ${colors.accent}; padding-bottom: 10px; margin-bottom: 14px;">
        <div style="font-family: '${fonts.heading}', serif; font-size: 24px; font-weight: 600; color: ${colors.text}; margin-bottom: 2px;">
          ${escapeHtml(overview.title)}
        </div>
        <div style="font-size: 12px; color: #64748b;">
          ${escapeHtml(overview.dates)}${overview.extensionNote ? ` · ${escapeHtml(overview.extensionNote)}` : ""}
        </div>
      </div>
      <div class="section-title" style="color: ${colors.accent}; font-weight: 600;">${t("pdfBuilder.tourOverviewTitle")}</div>
      <div style="font-size: 12px; line-height: 1.6; margin-bottom: 20px;">${nl2br(escapeHtml(overview.welcomeText))}</div>
      <div class="section-title" style="color: ${colors.accent}; font-weight: 600;">${t("pdfBuilder.tourHighlightsTitle")}</div>
      <div style="margin-bottom: 20px;">
        ${inclusions.highlights.map((h) => `<div class="bullet">${escapeHtml(h)}</div>`).join("")}
      </div>
      <div class="inclusions-exclusions-block" style="display: grid; grid-template-columns: 1fr 1fr; gap: 28px; align-items: start;">
        <div>
          <div class="section-title" style="color: ${colors.accent}; font-weight: 600;">${t("pdfBuilder.tourInclusionsTitle")}</div>
          ${inclusions.included.map((item) => `<div class="bullet">${escapeHtml(item)}</div>`).join("")}
        </div>
        <div>
          <div class="section-title" style="color: ${colors.accent}; font-weight: 600;">${t("pdfBuilder.tourExclusionsTitle")}</div>
          ${inclusions.excluded.map((item) => `<div class="bullet">${escapeHtml(item)}</div>`).join("")}
        </div>
      </div>
      </div>
      <div class="page-footer" style="background-color: ${footerColor};">${contactLine}</div>
    </div>

    ${tourManagerHtml || ""}

    ${itineraryPages
      .map(
        (days) => `
    <div class="page">
      <div class="page-content">
      <div class="section-title" style="color: ${colors.accent}; font-weight: 600;">${t("pdfBuilder.dailyItineraryTitle")}</div>
      <div class="itinerary-grid">
        ${days.map(renderItineraryDay).join("")}
      </div>
      </div>
      <div class="page-footer" style="background-color: ${footerColor};">${contactLine}</div>
    </div>
    `
      )
      .join("")}

    ${extensionHtml || ""}

    <div class="page">
      <div class="page-content">
      <div class="section-title" style="color: ${colors.accent}; font-weight: 600;">${t("pdfBuilder.tourPriceTitle")}</div>
      <div style="margin-bottom: 12px;">
        <div style="font-size: 13px; font-weight: 600; margin-bottom: 2px;">${escapeHtml(price.mainTitle)}</div>
        <div style="font-size: 12px;">${escapeHtml(price.mainPrice)}</div>
        <div style="font-size: 11px; color: #64748b;">${escapeHtml(price.mainSingleSupplement)}</div>
      </div>
      ${
        price.extensionTitle && optionalExtension?.enabled !== false
          ? `
      <div style="margin-bottom: 12px;">
        <div style="font-size: 13px; font-weight: 600; margin-bottom: 2px;">${escapeHtml(price.extensionTitle)}</div>
        <div style="font-size: 12px;">${escapeHtml(price.extensionPrice || "")}</div>
        <div style="font-size: 11px; color: #64748b;">${escapeHtml(price.extensionSingleSupplement || "")}</div>
      </div>
      `
          : ""
      }
      <div style="font-size: 10px; line-height: 1.5; margin-bottom: 8px;">${escapeHtml(price.currencyNote)}</div>
      ${
        price.additionalNotes
          ? `
      <div class="section-title" style="color: ${colors.accent}; font-weight: 600; margin-top: 12px;">${t("pdfBuilder.additionalNotesTitle")}</div>
      <div style="font-size: 10px; line-height: 1.5; white-space: pre-wrap; margin-bottom: 8px;">${nl2br(escapeHtml(price.additionalNotes))}</div>
      `
          : ""
      }
      ${price.discountNote ? `<div style="font-size: 11px; color: ${colors.accent}; font-weight: 600; margin-bottom: 8px;">${escapeHtml(price.discountNote)}</div>` : ""}
      </div>
      <div class="page-footer" style="background-color: ${footerColor};">${contactLine}</div>
    </div>
  </body>
</html>`;
}
