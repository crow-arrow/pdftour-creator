import { NextResponse } from "next/server";
import { generatePdfBuffer } from "@/lib/pdf/generatePdf";
import type { Locale, PricingConfig, QuoteInput } from "@/lib/types";

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

  const pdf = await generatePdfBuffer(body.quote, body.pricing, locale);

  const base =
    locale === "de" ? `Angebot_${body.quote.quoteNumber}` : `Quote_${body.quote.quoteNumber}`;
  const client = safeFileSegment(body.quote.clientName);
  const filename = `${base}_${client}_${locale.toUpperCase()}.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
