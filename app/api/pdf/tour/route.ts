import { NextResponse } from "next/server";
import { renderTourHtml } from "@/lib/pdf-builder/renderTourHtml";
import type { TourBuilderState } from "@/lib/pdf-builder/types";
import { getPdfBrowser, preparePdfPage } from "@/lib/pdf/browser";

export const runtime = "nodejs";

function safeFileSegment(value: string) {
  const safe = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return safe || "tour";
}

export async function POST(request: Request) {
  const body = (await request.json()) as { state: TourBuilderState; locale?: "en" | "de" };
  const { state, locale = "en" } = body;

  if (!state) {
    return NextResponse.json({ error: "Missing state" }, { status: 400 });
  }

  const html = renderTourHtml(state, locale);
  const browser = await getPdfBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await preparePdfPage(page, html, { waitTimeoutMs: 20000 });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" }
    });

    const filename = `tour-${safeFileSegment(state.cover.title)}-${Date.now()}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } finally {
    await context.close();
  }
}
