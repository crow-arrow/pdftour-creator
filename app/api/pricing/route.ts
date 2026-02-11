import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import type { PricingConfig, PricingItemConfig, PricingExtra, Tier } from "@/lib/types";
import defaultPricing from "@/data/pricingConfig.json";

export const runtime = "nodejs";

const DATA_FILE = path.join(process.cwd(), "data", "pricingConfig.json");

function isTier(value: unknown): value is Tier {
  if (!value || typeof value !== "object") return false;
  const tier = value as Partial<Tier>;
  return (
    typeof tier.minPeople === "number" &&
    (typeof tier.maxPeople === "number" || tier.maxPeople === null) &&
    typeof tier.price === "number"
  );
}

function isPricingItemConfig(value: unknown): value is PricingItemConfig {
  if (!value || typeof value !== "object") return false;
  const cfg = value as Partial<PricingItemConfig>;
  const validPricingModel = cfg.pricingModel === "per_person" || cfg.pricingModel === "per_group";
  const validMultiplier =
    cfg.multiplier === "per_day" || cfg.multiplier === "per_trip" || cfg.multiplier === "per_piece";
  const validTiers =
    Array.isArray(cfg.tiers) && cfg.tiers.length > 0 && cfg.tiers.every((t) => isTier(t));
  return !!validPricingModel && !!validMultiplier && validTiers;
}

function isPricingExtra(value: unknown): value is PricingExtra {
  if (!value || typeof value !== "object") return false;
  const extra = value as Partial<PricingExtra>;
  const validPricingModel = extra.pricingModel === "per_person" || extra.pricingModel === "per_group";
  const validMultiplier =
    extra.multiplier === "per_day" ||
    extra.multiplier === "per_trip" ||
    extra.multiplier === "per_piece";

  return (
    typeof extra.id === "string" &&
    typeof extra.titleEn === "string" &&
    typeof extra.titleDe === "string" &&
    typeof extra.price === "number" &&
    !!validPricingModel &&
    !!validMultiplier
  );
}

function isPricingConfig(value: unknown): value is PricingConfig {
  if (!value || typeof value !== "object") return false;
  const cfg = value as Partial<PricingConfig>;

  if (typeof cfg.coverageMaxPeople !== "number") return false;
  if (!cfg.hotel || typeof cfg.hotel !== "object") return false;

  const hotel = cfg.hotel as PricingConfig["hotel"];
  const hotelKeys: (keyof PricingConfig["hotel"])[] = ["budget", "premium", "luxury"];
  if (!hotelKeys.every((key) => isPricingItemConfig(hotel[key]))) return false;

  if (!isPricingItemConfig(cfg.dinner)) return false;
  if (!isPricingItemConfig(cfg.guide)) return false;
  if (!isPricingItemConfig(cfg.flight)) return false;

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

