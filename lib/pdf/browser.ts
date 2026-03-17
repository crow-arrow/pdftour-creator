import { chromium, type Browser, type Page } from "playwright";

type BrowserGlobal = typeof globalThis & {
  __pdfBrowserPromise?: Promise<Browser>;
  __pdfBrowserCleanupRegistered?: boolean;
};

const browserGlobal = globalThis as BrowserGlobal;

async function launchPdfBrowser(): Promise<Browser> {
  return chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-software-rasterizer",
      "--use-gl=disabled",
      "--disable-features=Vulkan"
    ]
  });
}

function registerCleanupOnce() {
  if (browserGlobal.__pdfBrowserCleanupRegistered) return;
  browserGlobal.__pdfBrowserCleanupRegistered = true;

  const cleanup = async () => {
    try {
      const browser = await browserGlobal.__pdfBrowserPromise;
      if (browser?.isConnected()) {
        await browser.close();
      }
    } catch {
      // ignore shutdown failures
    }
  };

  process.once("beforeExit", cleanup);
  process.once("SIGINT", cleanup);
  process.once("SIGTERM", cleanup);
}

export async function getPdfBrowser(): Promise<Browser> {
  registerCleanupOnce();

  if (!browserGlobal.__pdfBrowserPromise) {
    browserGlobal.__pdfBrowserPromise = launchPdfBrowser();
  }

  let browser: Browser;
  try {
    browser = await browserGlobal.__pdfBrowserPromise;
  } catch {
    browserGlobal.__pdfBrowserPromise = launchPdfBrowser();
    browser = await browserGlobal.__pdfBrowserPromise;
  }

  if (!browser.isConnected()) {
    browserGlobal.__pdfBrowserPromise = launchPdfBrowser();
    browser = await browserGlobal.__pdfBrowserPromise;
  }

  return browser;
}

export async function preparePdfPage(
  page: Page,
  html: string,
  options?: { waitTimeoutMs?: number }
): Promise<void> {
  const timeoutMs = options?.waitTimeoutMs ?? 15000;

  await page.setContent(html, { waitUntil: "domcontentloaded" });

  // Let pending network requests settle, but do not fail hard.
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});

  // Ensure web fonts and image resources are loaded before PDF rendering.
  await page
    .evaluate(async (ms) => {
      const waitWithTimeout = async (promise: Promise<unknown>, timeout: number) => {
        await Promise.race([
          promise,
          new Promise<void>((resolve) => setTimeout(resolve, timeout))
        ]);
      };

      if ("fonts" in document) {
        // document.fonts.ready is required to avoid fallback fonts in output PDF.
        await waitWithTimeout((document as Document & { fonts: FontFaceSet }).fonts.ready, ms);
      }

      const imageElements = Array.from(document.images);
      const waitImageLoad = imageElements.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        });
      });
      await waitWithTimeout(Promise.all(waitImageLoad), ms);

      const decodeOps = imageElements
        .map((img) => (typeof img.decode === "function" ? img.decode().catch(() => undefined) : Promise.resolve()))
        .filter(Boolean);
      await waitWithTimeout(Promise.all(decodeOps), ms);
    }, timeoutMs)
    .catch(() => {});
}
