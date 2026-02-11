import fs from "node:fs";
import path from "node:path";
import type { CalculatedQuote, Locale, PricingConfig, QuoteInput } from "@/lib/types";
import { createT } from "@/lib/i18n";
import { formatCurrency, formatDate } from "@/lib/format";

interface RenderParams {
  quote: QuoteInput;
  pricing: PricingConfig;
  locale: Locale;
  calculated: CalculatedQuote;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function stripTierPrefix(value: string) {
  return value.replace(/^(tier|Staffel)[^,]*,\s*/i, "");
}

function getStampDataUrl() {
  try {
    const filePath = path.join(process.cwd(), "assets", "Jinn Limited Stamp.png");
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const base64 = fs.readFileSync(filePath).toString("base64");
    return `data:image/png;base64,${base64}`;
  } catch {
    return null;
  }
}

export function renderQuoteHtml({ quote, locale, calculated }: RenderParams) {
  const t = createT(locale);
  const title = t("pdf.title");
  const headerLabel = locale === "de" ? t("labels.offer") : t("labels.quote");
  const yes = t("labels.yes");
  const no = t("labels.no");
  const hotelLabel = t(`items.hotel_${quote.hotelTier}` as any);
  const stampDataUrl = getStampDataUrl();

  const rows = calculated.items
    .map((item) => {
      const title = item.titleKey ? t(item.titleKey as any) : item.title ?? "";
      const qty =
        item.key.startsWith("hotel_") && quote.peopleCount > 0
          ? Math.round(item.qty / quote.peopleCount)
          : item.qty;
      return `
        <tr>
          <td>${escapeHtml(title)}</td>
          <td style="color: var(--muted)">${escapeHtml(
            stripTierPrefix(item.pricingNotes)
          )}</td>
          <td>${qty}</td>
        </tr>
      `;
    })
    .join("");

  const subtotalPerTraveler =
    quote.peopleCount > 0
      ? calculated.total / quote.peopleCount
      : calculated.total;

  const stampHtml = stampDataUrl
    ? `<img class="stamp-watermark" src="${stampDataUrl}" alt="Jinn Limited Premium" />`
    : "";

  return `<!doctype html>
  <html lang="${locale}">
    <head>
      <meta charSet="utf-8" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap"
      />
      <style>
        :root {
          --accent: #CBAF87;
          --ink: #0f172a;
          --muted: #64748b;
          --line: #e2e8f0;
        }
        * {
          box-sizing: border-box;
        }
        body {
          font-family: "Inter", sans-serif;
          color: var(--ink);
          margin: 0;
          padding: 0;
          background: #fff;
        }
        .page {
          padding: 0 56px 0;
          position: relative;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          border-bottom: 2px solid var(--accent);
          padding-bottom: 20px;
        }
        .logo {
          font-family: "Playfair Display", serif;
          font-size: 28px;
          margin: 0;
        }
        .tagline {
          margin: 6px 0 0;
          color: var(--muted);
          font-size: 12px;
        }
        .quote-meta {
          text-align: right;
          font-size: 12px;
        }
        .quote-meta strong {
          display: block;
          font-size: 14px;
        }
        .section {
          margin-top: 20px;
        }
        .section-title {
          font-weight: 600;
          font-size: 13px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--muted);
          margin: 0 0 12px;
        }
        .client-box {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 16px;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: #fafafa;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          font-size: 13px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12.5px;
        }
        thead th {
          text-align: left;
          font-weight: 600;
          color: var(--muted);
          border-bottom: 1px solid var(--line);
          padding: 10px 8px;
        }
        tbody td {
          padding: 12px 8px;
          border-bottom: 1px solid var(--line);
          vertical-align: top;
        }
        tbody tr:last-child td {
          border-bottom: none;
        }
        .total-row {
          background: #f8fafc;
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          font-size: 16px;
          font-weight: 600;
          margin-top: 18px;
        }
        .stamp-watermark {
          position: absolute;
          right: 48px;
          bottom: 0;
          width: 240px;
          height: auto;
          opacity: 0.85;
          pointer-events: none;
        }
        .notes {
          font-size: 12px;
          color: var(--muted);
          line-height: 1.5;
        }
        .terms {
          font-size: 12px;
          color: var(--muted);
          line-height: 1.5;
        }
        .accent-pill {
          display: inline-block;
          padding: 4px 10px;
          margin-bottom: 12px;
          border-radius: 999px;
          font-size: 24px;
          background: rgba(203, 175, 135, 0.15);
          color: #7c5b2c;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="section">
          <div class="client-box">
            <div>
              <div class="section-title">${escapeHtml(t("labels.tripInfo"))}</div>
              <div style="font-weight: 600">${escapeHtml(quote.clientName)}</div>
              <div style="color: var(--muted); margin-top: 4px">
                ${quote.peopleCount} ${escapeHtml(t("labels.peopleCount").toLowerCase())} · ${quote.days} ${escapeHtml(t("labels.days").toLowerCase())}
              </div>
            </div>
            <div class="quote-meta">
              <span class="accent-pill">${escapeHtml(title)}</span>
              <div>${escapeHtml(t("labels.quoteNumber"))}: ${escapeHtml(quote.quoteNumber)}</div>
              <div>${escapeHtml(t("labels.date"))}: ${escapeHtml(formatDate(quote.date, locale))}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">${escapeHtml(t("labels.tripSummary"))}</div>
          <div class="summary-grid">
            <div>${escapeHtml(t("labels.peopleCount"))}: ${quote.peopleCount}</div>
            <div>${escapeHtml(t("labels.days"))}: ${quote.days}</div>
            <div>${escapeHtml(t("labels.hotelTier"))}: ${escapeHtml(hotelLabel)}</div>
            <div>${escapeHtml(t("labels.dinnerIncluded"))}: ${quote.dinnerIncluded ? escapeHtml(yes) : escapeHtml(no)}</div>
            <div>${escapeHtml(t("labels.guideIncluded"))}: ${quote.guideIncluded ? escapeHtml(yes) : escapeHtml(no)}</div>
            <div>${escapeHtml(t("labels.flightIncluded"))}: ${quote.internationalFlight ? escapeHtml(yes) : escapeHtml(no)}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">${escapeHtml(t("labels.includedServices"))}</div>
          <table>
            <thead>
              <tr>
                <th>${escapeHtml(t("labels.item"))}</th>
                <th>${escapeHtml(t("labels.details"))}</th>
                <th>${escapeHtml(t("labels.qty"))}</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <div class="total-row" style="margin-top: 14px; font-size: 14px;">
            <span>${escapeHtml(t("labels.subtotalPerTraveler"))}</span>
            <span>${escapeHtml(formatCurrency(subtotalPerTraveler, locale))}</span>
          </div>
          <div class="total-row">
            <span>${escapeHtml(t("labels.total"))}</span>
            <span>${escapeHtml(formatCurrency(calculated.total, locale))}</span>
          </div>
          <div style="margin-top: 8px; font-size: 11px; color: var(--muted); text-align: right;">
            ${escapeHtml(t("labels.totalIncludes"))}
          </div>
        </div>

        <div class="section">
          <div class="section-title">${escapeHtml(t("labels.notes"))}</div>
          <p class="notes">${escapeHtml(t("pdf.notes"))}</p>

          <div class="section-title" style="margin-top: 16px;">${escapeHtml(t("labels.terms"))}</div>
          <p class="terms">${escapeHtml(t("pdf.terms"))}</p>
        </div>
        
      </div>
      <!-- ${stampHtml} -->
    </body>
  </html>`;
}
