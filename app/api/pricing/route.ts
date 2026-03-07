import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import type { PricingConfig, HotelPricingConfig, SimplePricingConfig, PricingExtra } from "@/lib/types";
import defaultPricing from "@/data/pricingConfig.json";

export const runtime = "nodejs";

const DATA_FILE = path.join(process.cwd(), "data", "pricingConfig.json");

function isHotelPricingConfig(value: unknown): value is HotelPricingConfig {
  if (!value || typeof value !== "object") return false;
  const cfg = value as Partial<HotelPricingConfig>;
  const validPricingModel = cfg.pricingModel === "per_person" || cfg.pricingModel === "per_group";
  const validMultiplier =
    cfg.multiplier === "per_day" || cfg.multiplier === "per_trip" || cfg.multiplier === "per_piece";
  return (
    !!validPricingModel &&
    !!validMultiplier &&
    typeof cfg.basePrice === "number" &&
    typeof cfg.singleSupplementPrice === "number" &&
    cfg.singleSupplementPrice >= 0
  );
}

function isPricingExtra(value: unknown): value is PricingExtra {
  if (!value || typeof value !== "object") return false;
  const extra = value as Partial<PricingExtra>;
  const validPricingModel = extra.pricingModel === "per_person" || extra.pricingModel === "per_group";
  const validMultiplier =
    extra.multiplier === "per_day" ||
    extra.multiplier === "per_trip" ||
    extra.multiplier === "per_piece";
  const validPriceSource = extra.priceSource === "hotel" || extra.priceSource === undefined;

  return (
    typeof extra.id === "string" &&
    typeof extra.titleEn === "string" &&
    typeof extra.titleDe === "string" &&
    typeof extra.price === "number" &&
    !!validPricingModel &&
    !!validMultiplier &&
    (validPriceSource ? validPriceSource : true)
  );
}

function isPricingConfig(value: unknown): value is PricingConfig {
  if (!value || typeof value !== "object") return false;
  const cfg = value as Partial<PricingConfig>;

  if (typeof cfg.coverageMaxPeople !== "number") return false;
  if (!cfg.hotel || typeof cfg.hotel !== "object") return false;

  const hotel = cfg.hotel as PricingConfig["hotel"];
  const hotelKeys: (keyof PricingConfig["hotel"])[] = ["budget", "premium", "luxury"];
  if (!hotelKeys.every((key) => isHotelPricingConfig(hotel[key]))) return false;

  if (!Array.isArray(cfg.extras) || !cfg.extras.every((e) => isPricingExtra(e))) return false;

  return true;
}

async function readPricingConfig(): Promise<PricingConfig> {
  try {
    const buffer = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(buffer) as unknown;
    if (isPricingConfig(parsed)) {
      return parsed;
    }
    console.error("[pricing-api] Invalid pricingConfig.json structure, falling back to default");
    return defaultPricing as PricingConfig;
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      // Файл ещё не создан — отдаем дефолтную конфигурацию
      return defaultPricing as PricingConfig;
    }
    console.error("[pricing-api] Failed to read pricingConfig.json", error);
    throw error;
  }
}

async function writePricingConfig(config: PricingConfig): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  const json = JSON.stringify(config, null, 2);
  await fs.writeFile(DATA_FILE, json, "utf8");
}

export async function GET() {
  try {
    const pricing = await readPricingConfig();
    return NextResponse.json<PricingConfig>(pricing, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to load pricing configuration" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    if (!isPricingConfig(body)) {
      return NextResponse.json(
        { error: "Invalid pricing configuration payload" },
        { status: 400 }
      );
    }

    const config = body as PricingConfig;
    await writePricingConfig(config);

    return NextResponse.json<PricingConfig>(config, { status: 200 });
  } catch (error) {
    console.error("[pricing-api] Failed to save pricing configuration", error);
    return NextResponse.json(
      { error: "Failed to save pricing configuration" },
      { status: 500 }
    );
  }
}

