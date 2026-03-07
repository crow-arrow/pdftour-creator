"use client";

import { useEffect } from "react";
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
import { NumberInput } from "@/components/ui/number-input";
import { createT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import type { PricingConfig, HotelPricingConfig, SimplePricingConfig, PricingExtra } from "@/lib/types";
import { useLocale } from "@/components/locale-provider";
import { usePricingStore, type PricingTarget } from "@/store/pricingStore";
import { useQuoteStore } from "@/store/quoteStore";

const sections: { key: PricingTarget; titleKey: string }[] = [
  { key: "hotel.budget", titleKey: "items.hotel_budget" },
  { key: "hotel.premium", titleKey: "items.hotel_premium" },
  { key: "hotel.luxury", titleKey: "items.hotel_luxury" }
];

function getConfig(target: PricingTarget, pricing: PricingConfig) {
  if (target.startsWith("hotel.")) {
    const key = target.split(".")[1] as keyof typeof pricing.hotel;
    return pricing.hotel[key];
  }
  return pricing.extras.find((item) => item.id === target);
}

function HotelPricingSection({
  title,
  config,
  target,
  t
}: {
  title: string;
  config: HotelPricingConfig;
  target: PricingTarget;
  t: (key: TranslationKey) => string;
}) {
  const { updateConfig } = usePricingStore();

  return (
    <Card className="space-y-4">
      <CardHeader>
        <CardTitle><h3 className="text-base font-semibold">{title}</h3></CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormItem>
            <FormLabel>{t("labels.basePrice")} (€)</FormLabel>
            <FormControl>
              <NumberInput
                min={0}
                value={config.basePrice}
                onChange={(v) => updateConfig(target, { basePrice: v })}
              />
            </FormControl>
          </FormItem>
          <FormItem>
            <FormLabel>{t("labels.singleSupplementPrice")} (€)</FormLabel>
            <FormControl>
              <NumberInput
                value={config.singleSupplementPrice}
                onChange={(v) => updateConfig(target, { singleSupplementPrice: v })}
                min={0}
              />
            </FormControl>
          </FormItem>
          <FormItem>
            <FormLabel>{t("labels.pricingModel")}</FormLabel>
            <FormControl>
              <Select
                value={config.pricingModel}
                onValueChange={(value) =>
                  updateConfig(target, { pricingModel: value as HotelPricingConfig["pricingModel"] })
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
          <FormItem>
            <FormLabel>{t("labels.multiplier")}</FormLabel>
            <FormControl>
              <Select
                value={config.multiplier}
                onValueChange={(value) =>
                  updateConfig(target, { multiplier: value as HotelPricingConfig["multiplier"] })
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
      </CardContent>
    </Card>
  );
}

function SimplePricingSection({
  title,
  config,
  target,
  t
}: {
  title: string;
  config: SimplePricingConfig;
  target: PricingTarget;
  t: (key: TranslationKey) => string;
}) {
  const { updateConfig } = usePricingStore();

  return (
    <Card className="space-y-4">
      <CardHeader>
        <CardTitle><h3 className="text-base font-semibold">{title}</h3></CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormItem>
            <FormLabel>{t("labels.price")} (€)</FormLabel>
            <FormControl>
              <NumberInput
                min={0}
                value={config.price}
                onChange={(v) => updateConfig(target, { price: v })}
              />
            </FormControl>
          </FormItem>
          <FormItem>
            <FormLabel>{t("labels.pricingModel")}</FormLabel>
            <FormControl>
              <Select
                value={config.pricingModel}
                onValueChange={(value) =>
                  updateConfig(target, { pricingModel: value as SimplePricingConfig["pricingModel"] })
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
          <FormItem>
            <FormLabel>{t("labels.multiplier")}</FormLabel>
            <FormControl>
              <Select
                value={config.multiplier}
                onValueChange={(value) =>
                  updateConfig(target, { multiplier: value as SimplePricingConfig["multiplier"] })
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
      </CardContent>
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
              .replace("{days}", String(quote.days))}
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
          {sections.map((section) =>
            section.key.startsWith("hotel.") ? (
              <HotelPricingSection
                key={section.key}
                title={t(section.titleKey as TranslationKey)}
                t={t}
                config={getConfig(section.key, pricing) as HotelPricingConfig}
                target={section.key}
              />
            ) : (
              <SimplePricingSection
                key={section.key}
                title={t(section.titleKey as TranslationKey)}
                t={t}
                config={getConfig(section.key, pricing) as SimplePricingConfig}
                target={section.key}
              />
            )
          )}
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
                <NumberInput
                  min={0}
                  value={extra.price}
                  onChange={(v) => updateExtra(extra.id, { price: v })}
                  placeholder={t("labels.servicePrice")}
                />
                <Select
                  value={extra.pricingModel}
                  onValueChange={(value) =>
                    updateExtra(extra.id, {
                      pricingModel: value as PricingExtra["pricingModel"]
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
                      multiplier: value as PricingExtra["multiplier"]
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
