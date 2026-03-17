import { NextResponse } from "next/server";
import { chromium } from "playwright";
import { renderTourHtml } from "@/lib/pdf-builder/renderTourHtml";
import type { TourBuilderState } from "@/lib/pdf-builder/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { state: TourBuilderState; locale?: "en" | "de" };
  const { state, locale = "en" } = body;

  if (!state) {
    return NextResponse.json({ error: "Missing state" }, { status: 400 });
  }

  const html = renderTourHtml(state, locale);

  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined;
  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage"
    ]
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle" });

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "0", bottom: "0", left: "0", right: "0" }
  });

  await browser.close();

  const filename = `tour-${state.cover.title.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
