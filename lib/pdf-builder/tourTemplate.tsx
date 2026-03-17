"use client";

import type { TourBuilderState } from "./types";
import { MAX_DAY_DESCRIPTION_CHARS } from "./types";
import { useLocale } from "@/components/locale-provider";
import { createT } from "@/lib/i18n";

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

interface TourTemplateProps {
  state: TourBuilderState;
  className?: string;
  isPdf?: boolean;
}

export function TourTemplate({ state, className = "", isPdf = false }: TourTemplateProps) {
  const { locale } = useLocale();
  const t = createT(locale);
  const { colors, fonts, cover, overview, inclusions, tourManager, price, itinerary, optionalExtension, contact } =
    state;
  const contactLine = `${contact.phone} | ${contact.email} | ${contact.website}`;

  const fontHeading = fonts.heading.replace(/ /g, "+");
  const fontBody = fonts.body.replace(/ /g, "+");
  const coverFont = (cover.titleFont ?? fonts.heading).replace(/ /g, "+");
  const fontUrl = `https://fonts.googleapis.com/css2?family=${fontHeading}:wght@400;500;600;700&family=${fontBody}:wght@400;500;600;700&family=${coverFont}:wght@400;600;700&display=swap`;

  return (
    <div
      className={className}
      style={{
        fontFamily: `"${fonts.body}", sans-serif`,
        color: colors.text,
        backgroundColor: "#fff"
      }}
    >
      <link rel="stylesheet" href={fontUrl} />
      <style>{`
        .tour-template * { box-sizing: border-box; }
        .tour-template .a4-page { width: 210mm; height: 297mm; max-height: 297mm; margin: 0 auto 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1px solid #e5e7eb; overflow: hidden; }
        .tour-template .page { display: flex; flex-direction: column; padding: 32px 40px 0; page-break-after: always; height: 100%; min-height: 0; }
        .tour-template .page:last-child { page-break-after: auto; }
        .tour-template .page-content { flex: 1; min-height: 0; overflow-y: auto; }
        .tour-template .page-footer { margin-top: auto; margin-left: -40px; margin-right: -40px; padding: 12px 40px 12px; font-size: 10px; color: rgba(255,255,255,0.95); }
        .tour-template .cover { height: 100%; min-height: 0; display: flex; flex-direction: column; justify-content: flex-end; padding: 40px 48px; background-size: cover; background-position: center; position: relative; }
        .tour-template .cover-logo { position: absolute; top: 24px; left: 24px; max-width: 180px; max-height: 100px; object-fit: contain; }
        .tour-template .section-title { font-size: 14px; letter-spacing: 0.14em; text-transform: uppercase; margin-top: 26px; margin-bottom: 12px; }
        .tour-template .bullet-highlight { margin-bottom: 4px; padding-left: 14px; position: relative; font-size: 11px; line-height: 1.4; }
        .tour-template .bullet-highlight::before { content: "•"; position: absolute; left: 0; }
        .tour-template .bullet-inclusion { margin-bottom: 4px; padding-left: 14px; position: relative; font-size: 11px; line-height: 1.4; }
        .tour-template .bullet-inclusion::before { content: "+"; position: absolute; left: 0; color: green; }
        .tour-template .bullet-exclusion { margin-bottom: 4px; padding-left: 14px; position: relative; font-size: 11px; line-height: 1.4; }
        .tour-template .bullet-exclusion::before { content: "-"; position: absolute; left: 0; color: red; }
        .tour-template .itinerary-grid { display: flex; flex-direction: column; gap: 36px; margin-top: 26px; }
        .tour-template .itinerary-day { break-inside: avoid; }
        .tour-template .itinerary-day-card { display: flex; gap: 24px; margin-bottom: 10px; }
        .tour-template .itinerary-day-img { width: 220px; min-width: 220px; height: 165px; background-size: cover; background-position: center; border-radius: 8px; }
        .tour-template .inclusions-exclusions-block { break-inside: avoid; }
        .tour-template .itinerary-day-body { flex: 1; min-width: 0; }
      `}</style>

      <div className="tour-template">
        {/* Cover */}
        <div className="a4-page">
          <div
            className="cover"
            style={{
              backgroundImage: `url(${escapeHtml(cover.backgroundImageUrl)})`
            }}
          >
          {cover.logoUrl && (
            <img
              src={escapeHtml(cover.logoUrl)}
              alt="Logo"
              className="cover-logo"
              width={220}
              height={120}
            />
          )}
          <h1
            style={{
              fontFamily: `"${cover.titleFont ?? fonts.heading}", serif`,
              fontSize: "48px",
              fontWeight: Number(cover.titleWeight ?? "700"),
              color: cover.titleColor ?? "#fff",
              textShadow: "0 2px 4px rgba(0,0,0,0.5)",
              textTransform: cover.titleStyle ?? "uppercase",
              letterSpacing:
                cover.titleLetterSpacing === "wide"
                  ? "0.12em"
                  : cover.titleLetterSpacing === "extra-wide"
                    ? "0.2em"
                    : "normal",
              marginBottom: "8px",
              margin: 0
            }}
          >
            {cover.title}
          </h1>
          <div
            style={{
              fontSize: "20px",
              color: "rgba(255,255,255,0.95)",
              letterSpacing: "0.05em"
            }}
          >
            {cover.subtitle}
          </div>
        </div>
        </div>

        {/* Tour Overview + Highlights + Inclusions + Exclusions — one page, Inclusions/Exclusions move together if overflow */}
        <div className="a4-page">
        <div className="page">
          <div className="page-content">
          <div
            style={{
              borderBottom: `2px solid ${colors.accent}`,
              paddingBottom: "10px",
              marginBottom: "14px"
            }}
          >
            <div
              style={{
                fontFamily: `"${fonts.heading}", serif`,
                fontSize: "24px",
                fontWeight: 600,
                color: colors.text,
                marginBottom: "2px"
              }}
            >
              {overview.title}
            </div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              {overview.dates}
              {overview.extensionNote && ` · ${overview.extensionNote}`}
            </div>
          </div>
          <div
            className="section-title"
            style={{ color: colors.accent, fontWeight: 600 }}
          >
            {t("pdfBuilder.tourOverviewTitle")}
          </div>
          <div
            style={{
              fontSize: "12px",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              marginBottom: "20px"
            }}
            dangerouslySetInnerHTML={{ __html: nl2br(escapeHtml(overview.welcomeText)) }}
          />
          <div className="section-title" style={{ color: colors.accent, fontWeight: 600 }}>
            {t("pdfBuilder.tourHighlightsTitle")}
          </div>
          <div style={{ marginBottom: "20px" }}>
            {inclusions.highlights.map((h, i) => (
              <div key={i} className="bullet-highlight">
                {h}
              </div>
            ))}
          </div>
          <div className="inclusions-exclusions-block" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px", alignItems: "start" }}>
            <div>
              <div className="section-title" style={{ color: colors.accent, fontWeight: 600 }}>
                {t("pdfBuilder.tourInclusionsTitle")}
              </div>
              {inclusions.included.map((item, i) => (
                <div key={i} className="bullet-inclusion">
                  {item}
                </div>
              ))}
            </div>
            <div>
              <div className="section-title" style={{ color: colors.accent, fontWeight: 600 }}>
                {t("pdfBuilder.tourExclusionsTitle")}
              </div>
              {inclusions.excluded.map((item, i) => (
                <div key={i} className="bullet-exclusion">
                  {item}
                </div>
              ))}
            </div>
          </div>
          </div>
          <div className="page-footer" style={{ backgroundColor: colors.footer }}>
            {contactLine}
          </div>
        </div>
        </div>

        {/* Tour Manager — optional, with avatar */}
        {(tourManager.enabled !== false) && (
          <div className="a4-page">
          <div className="page">
            <div className="page-content">
            <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
              {tourManager.avatarUrl && (
                <div
                  style={{
                    width: "120px",
                    height: "120px",
                    minWidth: "120px",
                    borderRadius: "50%",
                    backgroundImage: `url(${escapeHtml(tourManager.avatarUrl)})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="section-title" style={{ color: colors.accent, fontWeight: 600 }}>
                  {t("pdfBuilder.tourManagerTitle")}: {tourManager.name}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    lineHeight: 1.55,
                    whiteSpace: "pre-wrap"
                  }}
                  dangerouslySetInnerHTML={{ __html: nl2br(escapeHtml(tourManager.bio)) }}
                />
              </div>
            </div>
            </div>
            <div className="page-footer" style={{ backgroundColor: colors.footer }}>
              {contactLine}
            </div>
          </div>
          </div>
        )}

        {/* Daily Itinerary — 3 days per A4 page, DAILY ITINERARY on each page */}
        {Array.from({ length: Math.ceil(itinerary.length / 3) }, (_, pageIndex) => {
          const daysOnPage = itinerary.slice(pageIndex * 3, pageIndex * 3 + 3);
          return (
            <div key={pageIndex} className="a4-page">
              <div className="page">
                <div className="page-content">
                  <div className="section-title" style={{ color: colors.accent, fontWeight: 600 }}>
                    {t("pdfBuilder.dailyItineraryTitle")}
                  </div>
                  <div className="itinerary-grid">
                    {daysOnPage.map((day) => (
                      <div key={day.id} className="itinerary-day">
                        <div className="itinerary-day-card">
                          {day.imageUrl && (
                            <div
                              className="itinerary-day-img"
                              style={{
                                backgroundImage: `url(${escapeHtml(day.imageUrl)})`
                              }}
                            />
                          )}
                          <div className="itinerary-day-body">
                            <div
                              style={{
                                fontFamily: `"${fonts.heading}", serif`,
                                fontSize: "14px",
                                fontWeight: 600,
                                marginBottom: "4px"
                              }}
                            >
                              {day.date}
                            </div>
                            <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>
                              {day.title}
                            </div>
                            {(day.additionalInfo && day.additionalInfo.length > 0
                              ? day.additionalInfo.filter((a) => a.label.trim() || a.value.trim())
                              : [
                                  ...(day.meals ? [{ label: t("pdfBuilder.meals"), value: day.meals }] : []),
                                  ...(day.location ? [{ label: t("pdfBuilder.location"), value: day.location }] : [])
                                ]
                            ).map((a, i) => (
                              <div key={i} style={{ fontSize: "11px", color: "#64748b", marginBottom: "2px" }}>
                                {a.label}: {a.value}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{ fontSize: "13px", lineHeight: 1.55 }}>{day.description.slice(0, MAX_DAY_DESCRIPTION_CHARS)}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="page-footer" style={{ backgroundColor: colors.footer }}>
                  {contactLine}
                </div>
              </div>
            </div>
          );
        })}

        {/* Optional Extension — 3 days per A4 page */}
        {optionalExtension && optionalExtension.enabled !== false &&
          Array.from({ length: Math.ceil(optionalExtension.days.length / 3) }, (_, pageIndex) => {
            const daysOnPage = optionalExtension.days.slice(pageIndex * 3, pageIndex * 3 + 3);
            return (
              <div key={pageIndex} className="a4-page">
                <div className="page">
                  <div className="page-content">
                    <div className="section-title" style={{ color: colors.accent, fontWeight: 600 }}>
                    {optionalExtension.title}
                    </div>
                    {pageIndex === 0 && (
                      <div style={{ fontSize: "11px", lineHeight: 1.55, marginBottom: "16px" }}>
                        {optionalExtension.intro}
                      </div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      {daysOnPage.map((day) => (
                        <div key={day.id} className="itinerary-day">
                          <div
                            style={{
                              fontFamily: `"${fonts.heading}", serif`,
                              fontSize: "12px",
                              fontWeight: 600,
                              marginBottom: "2px"
                            }}
                          >
                            {day.date}
                          </div>
                          <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                            {day.title}
                          </div>
                          <div style={{ fontSize: "11px", lineHeight: 1.5 }}>{day.description.slice(0, MAX_DAY_DESCRIPTION_CHARS)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="page-footer" style={{ backgroundColor: colors.footer }}>
                    {contactLine}
                  </div>
                </div>
              </div>
            );
          })}

        {/* Tour Price — at the end */}
        <div className="a4-page">
        <div className="page">
          <div className="page-content">
          <div className="section-title" style={{ color: colors.accent, fontWeight: 600 }}>
            {t("pdfBuilder.tourPriceTitle")}
          </div>
          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "2px" }}>
              {price.mainTitle}
            </div>
            <div style={{ fontSize: "12px" }}>{price.mainPrice}</div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>{price.mainSingleSupplement}</div>
          </div>
          {price.extensionTitle && optionalExtension?.enabled !== false && (
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "2px" }}>
                {price.extensionTitle}
              </div>
              <div style={{ fontSize: "12px" }}>{price.extensionPrice}</div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>
                {price.extensionSingleSupplement}
              </div>
            </div>
          )}
          <div style={{ fontSize: "10px", lineHeight: 1.5, marginBottom: "8px" }}>
            {price.currencyNote}
          </div>
          {price.additionalNotes && (
            <>
              <div className="section-title" style={{ color: colors.accent, fontWeight: 600, marginTop: "12px" }}>
                {t("pdfBuilder.additionalNotesTitle")}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  marginBottom: "8px"
                }}
                dangerouslySetInnerHTML={{ __html: nl2br(escapeHtml(price.additionalNotes)) }}
              />
            </>
          )}
          {price.discountNote && (
            <div style={{ fontSize: "11px", color: colors.accent, fontWeight: 600, marginBottom: "8px" }}>
              {price.discountNote}
            </div>
          )}
          </div>
          <div className="page-footer" style={{ backgroundColor: colors.footer }}>
            {contactLine}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
