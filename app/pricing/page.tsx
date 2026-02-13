"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardAction, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  FormControl,
  FormItem,
  FormLabel
} from "@/components/ui/form";
import { createT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import type { PricingConfig, PricingItemConfig, Tier } from "@/lib/types";
import { useLocale } from "@/components/locale-provider";
import { usePricingStore, type PricingTarget } from "@/store/pricingStore";
import { useQuoteStore } from "@/store/quoteStore";
import { cn } from "@/lib/utils";

const sections: { key: PricingTarget; titleKey: string }[] = [
  { key: "hotel.budget", titleKey: "items.hotel_budget" },
  { key: "hotel.premium", titleKey: "items.hotel_premium" },
  { key: "hotel.luxury", titleKey: "items.hotel_luxury" },
  { key: "dinner", titleKey: "items.dinner" },
  { key: "guide", titleKey: "items.guide" },
  { key: "flight", titleKey: "items.flight" }
];

function getConfig(target: PricingTarget, pricing: PricingConfig) {
  if (target.startsWith("hotel.")) {
    const key = target.split(".")[1] as keyof typeof pricing.hotel;
    return pricing.hotel[key];
  }
  return pricing[target as "dinner" | "guide" | "flight"];
}

function validateTiers(
  tiers: Tier[],
  coverageMaxPeople: number,
  t: (key: TranslationKey) => string
): string[] {
  const errors: string[] = [];
  if (tiers.length === 0) {
    errors.push(t("errors.addOneTier"));
    return errors;
  }
  const sorted = [...tiers].sort((a, b) => a.minPeople - b.minPeople);
  if (sorted[0].minPeople > 1) {
    errors.push(t("errors.rangeStartFromOne"));
  }
  for (let i = 0; i < sorted.length; i += 1) {
    const tier = sorted[i];
    if (tier.maxPeople !== null && tier.maxPeople < tier.minPeople) {
      errors.push(t("errors.tierMaxLessThanMin").replace("{min}", String(tier.minPeople)));
    }
    if (i > 0) {
      const prev = sorted[i - 1];
      const prevMax = prev.maxPeople ?? Number.POSITIVE_INFINITY;
      if (prevMax >= tier.minPeople) {
        errors.push(t("errors.overlapBetweenRanges"));
        break;
      }
    }
  }
  const last = sorted[sorted.length - 1];
  if (last.maxPeople !== null && last.maxPeople < coverageMaxPeople) {
    errors.push(t("errors.rangeCoverUpTo").replace("{max}", String(coverageMaxPeople)));
  }
  return errors;
}

function PricingSection({
  title,
  config,
  target,
  coverageMaxPeople,
  t
}: {
  title: string;
  config: PricingItemConfig;
  target: PricingTarget;
  coverageMaxPeople: number;
  t: (key: TranslationKey) => string;
}) {
  const { updateConfig, updateTier, addTier, removeTier } = usePricingStore();
  const errors = useMemo(
    () => validateTiers(config.tiers, coverageMaxPeople, t),
    [config.tiers, coverageMaxPeople, t]
  );

  return (
    <Card className="space-y-4">
      <CardHeader>
        <CardTitle><h3 className="text-base font-semibold">{title}</h3></CardTitle>
        <CardAction>
          <Button size="lg" onClick={() => addTier(target)}>
            {t("labels.addTier")}
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormItem className="w-full">
          <FormLabel>{t("labels.pricingModel")}</FormLabel>
          <FormControl>
            <Select
              value={config.pricingModel}
              onValueChange={(value) =>
                updateConfig(target, { pricingModel: value as PricingItemConfig["pricingModel"] })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="per_person">{t("labels.perPerson")}</SelectItem>
                <SelectItem value="per_group">{t("labels.perGroup")}</SelectItem>
              </SelectContent>
            </Select>
          </FormControl>
        </FormItem>
        <FormItem className="w-full">
          <FormLabel>{t("labels.multiplier")}</FormLabel>
          <FormControl>
            <Select
              value={config.multiplier}
              onValueChange={(value) =>
                updateConfig(target, { multiplier: value as PricingItemConfig["multiplier"] })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="per_day">{t("labels.perDay")}</SelectItem>
                <SelectItem value="per_trip">{t("labels.perTrip")}</SelectItem>
              </SelectContent>
            </Select>
          </FormControl>
        </FormItem>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="pb-2">{t("labels.minPeople")}</th>
              <th className="pb-2">{t("labels.maxPeople")}</th>
              <th className="pb-2">{t("labels.price")} (€)</th>
              <th className="pb-2">{t("labels.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {config.tiers.map((tier, index) => (
              <tr key={`${tier.minPeople}-${index}`}>
                <td className="py-2 pr-3">
                  <Input
                    type="number"
                    min={1}
                    value={tier.minPeople}
                    onChange={(event) => updateTier(target, index, { minPeople: Number(event.target.value) })}
                  />
                </td>
                <td className="py-2 pr-3">
                  <Input
                    type="number"
                    min={tier.minPeople}
                    value={tier.maxPeople ?? ""}
                    onChange={(event) =>
                      updateTier(target, index, {
                        maxPeople: event.target.value === "" ? null : Number(event.target.value)
                      })
                    }
                    placeholder="+"
                  />
                </td>
                <td className="py-2 pr-3">
                  <Input
                    type="number"
                    min={0}
                    value={tier.price}
                    onChange={(event) => updateTier(target, index, { price: Number(event.target.value) })}
                  />
                </td>
                <td className="py-2 w-10 text-end">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="destructive"
                      >
                        <Trash2 />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("dialog.deleteTierTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("dialog.deleteTierDescription")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("dialog.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          className={buttonVariants({ variant: "destructive" })}
                          onClick={() => {
                            removeTier(target, index);
                            toast.success(t("toast.tierDeleted"));
                          }}
                        >
                          {t("dialog.delete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </CardContent>

      <CardFooter>
      {errors.length > 0 && (
        <div className="w-full rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          {errors.map((error) => (
            <div key={error}>{error}</div>
          ))}
        </div>
      )}
      </CardFooter>
    </Card>
  );
}

export default function PricingPage() {
  const { locale } = useLocale();
  const t = createT(locale);
  const { pricing, addExtra, updateExtra, removeExtra, isSaving, loadPricing, savePricing } =
    usePricingStore();
  const { quote } = useQuoteStore();

  useEffect(() => {
    void loadPricing().catch(() => {
      toast.error(t("toast.loadFailed"));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualSave = async () => {
    try {
      await savePricing();
      toast.success(t("toast.saveSuccess"));
    } catch {
      toast.error(t("toast.saveFailed"));
    }
  };

  return (
    <>
      <div className="container-shell space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="rounded-md border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
            {t("pricing.activeQuote")
              .replace("{people}", String(quote.peopleCount))
              .replace("{days}", String(quote.days))
              .replace("{max}", String(pricing.coverageMaxPeople))}
          </div>
          <Button
            size="lg"
            className="min-w-full sm:min-w-32 whitespace-nowrap"
            onClick={handleManualSave}
            disabled={isSaving}
          >
            {t("pricing.save")}
            {isSaving && <Loader2 className="animate-spin" />}
          </Button>
        </div>

        <div className="grid gap-6">
          {sections.map((section) => (
            <PricingSection
              key={section.key}
              title={t(section.titleKey as any)}
              t={t}
              config={getConfig(section.key, pricing)}
              target={section.key}
              coverageMaxPeople={pricing.coverageMaxPeople}
            />
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle><h2>{t("labels.extraServices")}</h2></CardTitle>
            <CardAction>
              <Button onClick={addExtra}>
                {t("labels.addService")}
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
          <div className="space-y-8 sm:space-y-3">
            {pricing.extras.map((extra) => (
              <div
                key={extra.id}
                className="grid gap-3 sm:grid-cols-[1.2fr_1.2fr_0.6fr_0.6fr_0.6fr_auto]"
              >
                <Input
                  value={extra.titleEn}
                  onChange={(event) =>
                    updateExtra(extra.id, { titleEn: event.target.value })
                  }
                  placeholder={t("labels.serviceTitleEn")}
                />
                <Input
                  value={extra.titleDe}
                  onChange={(event) =>
                    updateExtra(extra.id, { titleDe: event.target.value })
                  }
                  placeholder={t("labels.serviceTitleDe")}
                />
                <Input
                  type="number"
                  min={0}
                  value={extra.price}
                  onChange={(event) =>
                    updateExtra(extra.id, { price: Number(event.target.value) })
                  }
                  placeholder={t("labels.servicePrice")}
                />
                <Select
                  value={extra.pricingModel}
                  onValueChange={(value) =>
                    updateExtra(extra.id, {
                      pricingModel: value as PricingItemConfig["pricingModel"]
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_person">{t("labels.perPerson")}</SelectItem>
                    <SelectItem value="per_group">{t("labels.perGroup")}</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={extra.multiplier}
                  onValueChange={(value) =>
                    updateExtra(extra.id, {
                      multiplier: value as PricingItemConfig["multiplier"]
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_day">{t("labels.perDay")}</SelectItem>
                    <SelectItem value="per_trip">{t("labels.perTrip")}</SelectItem>
                    <SelectItem value="per_piece">{t("labels.perPiece")}</SelectItem>
                  </SelectContent>
                </Select>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="w-full sm:w-10"
                      aria-label={t("labels.remove")}
                    >
                      <Trash2 />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t("dialog.deleteExtraTitle").replace("{name}", extra.titleEn)}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("dialog.deleteExtraDescription")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("dialog.cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        className={buttonVariants({ variant: "destructive"})}
                        onClick={() => {
                          removeExtra(extra.id);
                          toast.success(t("toast.extraDeleted"));
                        }}
                      >
                        {t("dialog.delete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
          </CardContent>
          <CardFooter>
            {pricing.extras.length === 0 && (
              <div className="w-full rounded-md border border-chart-2/30 bg-chart-2/10 p-3 text-sm text-muted-foreground">
                {t("pricing.noExtrasConfigured")}
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
