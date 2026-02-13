import { NextResponse } from "next/server";
import { writeFile, mkdir, readFile, access } from "fs/promises";
import path from "path";
import { generatePdfBuffer } from "@/lib/pdf/generatePdf";
import type { PricingConfig, QuoteInput } from "@/lib/types";

export const runtime = "nodejs";

const PDF_DIR = path.join(process.cwd(), "data", "pdf");
const METADATA_PATH = path.join(PDF_DIR, "metadata.json");

function safeQuoteNumber(value: string): string {
  return value.replace(/[^a-zA-Z0-9-]+/g, "_");
}

type MetadataRecord = Record<string, { clientName: string; date: string }>;

async function loadMetadata(): Promise<MetadataRecord> {
  try {
    const data = await readFile(METADATA_PATH, "utf-8");
    return JSON.parse(data) as MetadataRecord;
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    quote: QuoteInput;
    pricing: PricingConfig;
  };

  await mkdir(PDF_DIR, { recursive: true });

  const base = safeQuoteNumber(body.quote.quoteNumber);
  const enPath = path.join(PDF_DIR, `${base}_EN.pdf`);

  try {
    await access(enPath);
    return NextResponse.json(
      { error: "QUOTE_NUMBER_EXISTS" },
      { status: 409 }
    );
  } catch {
    // файл не найден — можно сохранять
  }

  const metadataEntry = {
    clientName: body.quote.clientName || "",
    date: body.quote.date || ""
  };

  try {
    const [pdfEn, pdfDe] = await Promise.all([
      generatePdfBuffer(body.quote, body.pricing, "en"),
      generatePdfBuffer(body.quote, body.pricing, "de")
    ]);

    await Promise.all([
      writeFile(path.join(PDF_DIR, `${base}_EN.pdf`), pdfEn),
      writeFile(path.join(PDF_DIR, `${base}_DE.pdf`), pdfDe)
    ]);

    const meta = await loadMetadata();
    meta[base] = metadataEntry;
    await writeFile(METADATA_PATH, JSON.stringify(meta, null, 2));
  } catch (err) {
    console.error("PDF save error:", err);
    return NextResponse.json(
      { error: "Failed to save PDF" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, quoteNumber: body.quote.quoteNumber });
}
