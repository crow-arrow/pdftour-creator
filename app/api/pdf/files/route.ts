import { NextResponse } from "next/server";
import { readdir, unlink, mkdir, readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const PDF_DIR = path.join(process.cwd(), "data", "pdf");
const METADATA_PATH = path.join(PDF_DIR, "metadata.json");

type SavedPdf = {
  quoteNumber: string;
  hasEn: boolean;
  hasDe: boolean;
  clientName: string;
  date: string;
};

type MetadataRecord = Record<string, { clientName: string; date: string }>;

async function loadMetadata(): Promise<MetadataRecord> {
  try {
    const data = await readFile(METADATA_PATH, "utf-8");
    return JSON.parse(data) as MetadataRecord;
  } catch {
    return {};
  }
}

function parseQuoteNumber(filename: string): string | null {
  const match = filename.match(/^(.+)_(EN|DE)\.pdf$/i);
  return match ? match[1] : null;
}

function metadataKey(quoteNumber: string): string {
  return quoteNumber.replace(/[^a-zA-Z0-9-]+/g, "_");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const quoteNumber = searchParams.get("quoteNumber");
  const locale = searchParams.get("locale");

  if (quoteNumber && locale) {
    const safe = quoteNumber.replace(/[^a-zA-Z0-9-]+/g, "_");
    const file = path.join(PDF_DIR, `${safe}_${locale.toUpperCase()}.pdf`);
    try {
      const { readFile } = await import("fs/promises");
      const buf = await readFile(file);
      const base = locale === "de" ? `Angebot_${quoteNumber}` : `Quote_${quoteNumber}`;
      const filename = `${base}_${locale.toUpperCase()}.pdf`;
      return new NextResponse(buf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`
        }
      });
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  }

  try {
    await mkdir(PDF_DIR, { recursive: true });
    const files = await readdir(PDF_DIR);
    const meta = await loadMetadata();
    const map = new Map<string, { hasEn: boolean; hasDe: boolean }>();

    for (const f of files) {
      const qn = parseQuoteNumber(f);
      if (!qn) continue;
      const current = map.get(qn) ?? { hasEn: false, hasDe: false };
      if (f.endsWith("_EN.pdf")) current.hasEn = true;
      if (f.endsWith("_DE.pdf")) current.hasDe = true;
      map.set(qn, current);
    }

    const list: SavedPdf[] = Array.from(map.entries())
      .map(([quoteNumber, { hasEn, hasDe }]) => {
        const key = metadataKey(quoteNumber);
        const m = meta[key] ?? meta[quoteNumber];
        return {
          quoteNumber,
          hasEn,
          hasDe,
          clientName: m?.clientName ?? "",
          date: m?.date ?? ""
        };
      })
      .sort((a, b) => b.quoteNumber.localeCompare(a.quoteNumber));

    return NextResponse.json({ files: list });
  } catch {
    return NextResponse.json({ files: [] });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const quoteNumber = searchParams.get("quoteNumber");
  if (!quoteNumber) {
    return NextResponse.json({ error: "quoteNumber required" }, { status: 400 });
  }

  const safe = quoteNumber.replace(/[^a-zA-Z0-9-]+/g, "_");
  const files = [
    path.join(PDF_DIR, `${safe}_EN.pdf`),
    path.join(PDF_DIR, `${safe}_DE.pdf`)
  ];

  for (const file of files) {
    try {
      await unlink(file);
    } catch {
      // ignore if file doesn't exist
    }
  }

  try {
    const meta = await loadMetadata();
    const key = metadataKey(quoteNumber);
    delete meta[key];
    delete meta[quoteNumber];
    const { writeFile } = await import("fs/promises");
    await writeFile(METADATA_PATH, JSON.stringify(meta, null, 2));
  } catch {
    // ignore metadata update errors
  }

  return NextResponse.json({ success: true });
}
