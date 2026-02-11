import { NextResponse } from "next/server";
import { chromium } from "playwright";
import { calculateQuote } from "@/lib/calc";
import { renderQuoteHtml } from "@/lib/pdf/template";
import type { Locale, PricingConfig, QuoteInput } from "@/lib/types";
import { createT } from "@/lib/i18n";

export const runtime = "nodejs";

function getLocale(url: string): Locale {
  const { searchParams } = new URL(url);
  const lang = searchParams.get("lang");
  return lang === "de" ? "de" : "en";
}

function safeFileSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9-_]+/g, "_").slice(0, 40);
}

export async function POST(request: Request) {
  const locale = getLocale(request.url);
  const body = (await request.json()) as {
    quote: QuoteInput;
    pricing: PricingConfig;
  };

  const calculated = calculateQuote(body.quote, body.pricing, locale);
  const html = renderQuoteHtml({
    quote: body.quote,
    pricing: body.pricing,
    locale,
    calculated
  });

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle" });

  const t = createT(locale);
  const contactLabel = "Contact";
  const contactValue = `${t("pdf.company")} · ${t("pdf.companyEmail")} · ${t("pdf.companyPhoneNumber")}`;
  const businessIdLabel = t("pdf.footer.businessIdLabel");
  const businessIdValue = t("pdf.footer.businessIdValue");
  const registeredAddressLabel = t("pdf.footer.registeredAddressLabel");
  const registeredAddressValue = t("pdf.footer.registeredAddressValue");
  const accountHolderLabel = t("pdf.footer.accountHolderLabel");
  const accountHolderValue = t("pdf.footer.accountHolderValue");
  const ibanLabel = t("pdf.footer.ibanLabel");
  const ibanValue = t("pdf.footer.ibanValue");
  const swiftLabel = t("pdf.footer.swiftLabel");
  const swiftValue = t("pdf.footer.swiftValue");
  const swiftInstantLabel = t("pdf.footer.swiftInstantLabel");
  const swiftInstantValue = t("pdf.footer.swiftInstantValue");
  const bankNameLabel = t("pdf.footer.bankNameLabel");
  const bankNameValue = t("pdf.footer.bankNameValue");
  const companyName = t("pdf.company");
  const companyTagline = t("pdf.companyTagline");

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "120px", bottom: "250px", left: "0px", right: "0px" },
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="width:100%; padding:0 56px 10px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:24px; border-bottom:2px solid #CBAF87; padding-bottom:20px;">
          <div>
            <div style="font-family:'Playfair Display', serif; font-size:28px; color:#0f172a; margin:0;">${companyName}</div>
            <div style="margin-top:6px; color:#64748b; font-size:12px;">${companyTagline}</div>
          </div>
        </div>
      </div>
    `,
    footerTemplate: `
      <div style="width:100%; font-size:8px; line-height:1.25; color:#64748b; padding:0 56px 8px; display:flex; justify-content:space-between; gap:16px;">
        <div style="display:flex; gap:16px; flex-wrap:wrap;">
          <div style="min-width:140px; max-width:220px;">
            <div style="font-weight:600; color:#475569;">${businessIdLabel}</div>
            <div>${businessIdValue}</div>
            <div style="margin-top:6px; font-weight:600; color:#475569;">${registeredAddressLabel}</div>
            <div>${registeredAddressValue}</div>
            <div style="margin-top:6px; font-weight:600; color:#475569;">${contactLabel}</div>
            <div>${contactValue}</div>
          </div>
          <div style="min-width:160px; max-width:220px;">
            <div style="font-weight:600; color:#475569;">${accountHolderLabel}</div>
            <div>${accountHolderValue}</div>
            <div style="margin-top:6px; font-weight:600; color:#475569;">${ibanLabel}</div>
            <div>${ibanValue}</div>
            <div style="margin-top:6px; font-weight:600; color:#475569;">${bankNameLabel}</div>
            <div>${bankNameValue}</div>
          </div>
          <div style="min-width:160px; max-width:220px;">
            <div style="font-weight:600; color:#475569;">${swiftLabel}</div>
            <div>${swiftValue}</div>
            <div style="margin-top:6px; font-weight:600; color:#475569;">${swiftInstantLabel}</div>
            <div>${swiftInstantValue}</div>
          </div>
        </div>
        <div style="align-self:flex-end; white-space:nowrap; font-size:8px;">Page <span class="pageNumber"></span> / <span class="totalPages"></span></div>
      </div>
    `
  });

  await browser.close();

  const base =
    locale === "de" ? `Angebot_${body.quote.quoteNumber}` : `Quote_${body.quote.quoteNumber}`;
  const client = safeFileSegment(body.quote.clientName);
  const filename = `${base}_${client}_${locale.toUpperCase()}.pdf`;

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
