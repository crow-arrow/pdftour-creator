"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  FormControl,
  FormItem,
  FormLabel
} from "@/components/ui/form";
import { calculateQuote } from "@/lib/calc";
import { createT } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import type { HotelTier, Locale } from "@/lib/types";
import { useLocale } from "@/components/locale-provider";
import { toast } from "sonner";
import { usePricingStore } from "@/store/pricingStore";
import { useQuoteStore } from "@/store/quoteStore";
import { Trash2 } from "lucide-react";
import { NumberStepper } from "@/components/NumberStepper";

export default function QuotePage() {
  const {
    quote,
    setField,
    addSelectedExtra,
    updateSelectedExtra,
    removeSelectedExtra,
    reorderSelectedExtras
  } = useQuoteStore();
  const { pricing } = usePricingStore();
  const { locale } = useLocale();
  const [selectedExtraId, setSelectedExtraId] = useState("");
  const t = createT(locale);

  const calculated = useMemo(() => {
    try {
      return calculateQuote(quote, pricing, locale);
    } catch {
      return null;
    }
  }, [quote, pricing, locale]);

  useEffect(() => {
    if (quote.selectedExtras.length === 0) {
      return;
    }
    quote.selectedExtras.forEach((selected) => {
      const extra = pricing.extras.find((item) => item.id === selected.id);
      if (!extra) {
        return;
      }
      if (extra.multiplier === "per_day" && selected.days > quote.days) {
        updateSelectedExtra(selected.id, { days: quote.days });
      }
    });
  }, [pricing.extras, quote.days, quote.selectedExtras, updateSelectedExtra]);

  const handleDownload = async (locale: Locale, preview = false) => {
    const response = await fetch(`/api/pdf?lang=${locale}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quote, pricing })
    });
    if (!response.ok) {
      toast.error(t("toast.pdfFailed"));
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    if (preview) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      const fileName = `${locale === "de" ? "Angebot" : "Quote"}_${quote.quoteNumber}_${locale.toUpperCase()}.pdf`;
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return (
    <div className="container-shell space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{t("app.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("app.subtitle")}</p>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle><h2 className="text-lg font-semibold">{t("nav.quote")}</h2></CardTitle>
          </CardHeader>
          <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormItem>
              <FormLabel>{t("labels.clientName")}</FormLabel>
              <FormControl>
                <Input
                  value={quote.clientName}
                  onChange={(event) => setField("clientName", event.target.value)}
                />
              </FormControl>
            </FormItem>
            <FormItem>
              <FormLabel>{t("labels.quoteNumber")}</FormLabel>
              <FormControl>
                <Input
                  value={quote.quoteNumber}
                  onChange={(event) => setField("quoteNumber", event.target.value)}
                />
              </FormControl>
            </FormItem>
            <FormItem>
              <FormLabel>{t("labels.date")}</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  value={quote.date}
                  onChange={(event) => setField("date", event.target.value)}
                />
              </FormControl>
            </FormItem>
            <FormItem>
              <FormLabel>{t("labels.peopleCount")}</FormLabel>
              <FormControl>
                <NumberStepper
                  value={quote.peopleCount}
                  size="lg"
                  onChange={(value: number) => setField("peopleCount", value)}
                />
              </FormControl>
            </FormItem>
            <FormItem>
              <FormLabel>{t("labels.days")}</FormLabel>
              <FormControl>
                <NumberStepper
                  value={quote.days}
                  size="lg"
                  onChange={(value: number) => setField("days", value)}
                />
              </FormControl>
            </FormItem>
            <FormItem>
              <FormLabel>{t("labels.hotelTier")}</FormLabel>
              <FormControl>
                <Select
                  value={quote.hotelTier}
                  onValueChange={(value: string) => setField("hotelTier", value as HotelTier)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="budget">Budget</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
            <FormItem>
              <FormLabel>{t("labels.localAgencyCommission")}</FormLabel>
              <FormControl>
                <NumberStepper
                  value={quote.localAgencyCommissionPct}
                  size="lg"
                  onChange={(value: number) => setField("localAgencyCommissionPct", value)}
                />
              </FormControl>
            </FormItem>
            <FormItem>
              <FormLabel>{t("labels.jinnCommission")}</FormLabel>
              <FormControl>
                <NumberStepper
                  value={quote.jinnCommissionPct}
                  size="lg"
                  onChange={(value: number) => setField("jinnCommissionPct", value)}
                />
              </FormControl>
            </FormItem>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormItem className="flex border border-border rounded-md p-2 items-center justify-between gap-2">
              <FormLabel className="text-sm font-medium">
                {t("labels.dinnerIncluded")}
              </FormLabel>
              <FormControl>
                <Switch
                  checked={quote.dinnerIncluded}
                  onCheckedChange={(value: boolean) => setField("dinnerIncluded", value)}
                />
              </FormControl>
            </FormItem>
            <FormItem className="flex border border-border rounded-md p-2 items-center justify-between gap-2">
              <FormLabel className="text-sm font-medium">
                {t("labels.guideIncluded")}
              </FormLabel>
              <FormControl>
                <Switch
                  checked={quote.guideIncluded}
                  onCheckedChange={(value: boolean) => setField("guideIncluded", value)}
                />
              </FormControl>
            </FormItem>
            <FormItem className="flex border border-border rounded-md p-2 items-center justify-between gap-2">
              <FormLabel className="text-sm font-medium">
                {t("labels.flightIncluded")}
              </FormLabel>
              <FormControl>
                <Switch
                  checked={quote.internationalFlight}
                  onCheckedChange={(value: boolean) =>
                    setField("internationalFlight", value)
                  }
                />
              </FormControl>
            </FormItem>
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-muted p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[240px]">
                <label className="text-sm font-medium">
                  {t("labels.extraServices")}
                </label>
                <Select
                  value={selectedExtraId}
                  onValueChange={(value: string) => {
                    if (value) {
                      addSelectedExtra(value, quote.days);
                      setSelectedExtraId("");
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("labels.selectService")} />
                  </SelectTrigger>
                  <SelectContent>
                    {pricing.extras
                      .filter(
                        (extra) =>
                          !quote.selectedExtras.some((selected) => selected.id === extra.id)
                      )
                      .map((extra) => (
                        <SelectItem key={extra.id} value={extra.id}>
                          {locale === "de" ? extra.titleDe : extra.titleEn} · €{extra.price}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              {quote.selectedExtras.map((selected) => {
                const extra = pricing.extras.find((item) => item.id === selected.id);
                if (!extra) {
                  return null;
                }
                const title = locale === "de" ? extra.titleDe : extra.titleEn;
                return (
                  <div
                    key={extra.id}
                    className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm"
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/plain", extra.id);
                      event.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const sourceId = event.dataTransfer.getData("text/plain");
                      if (sourceId && sourceId !== extra.id) {
                        reorderSelectedExtras(sourceId, extra.id);
                      }
                    }}
                  >
                    <div>
                      <div className="font-medium">{title}</div>
                      <div className="text-xs text-muted-foreground">€{extra.price}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {extra.multiplier === "per_day" && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{t("labels.serviceDays")}</span>
                          <div className="w-32">
                            <NumberStepper
                              value={selected.days}
                              buttonVariant="ghost"
                              onChange={(value: number) => updateSelectedExtra(extra.id, { days: value })}
                              min={1}
                              max={quote.days}
                            />
                          </div>
                        </div>
                      )}
                      {extra.multiplier === "per_piece" && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{t("labels.serviceQty")}</span>
                          <Input
                            type="number"
                            min={1}
                            value={selected.quantity}
                            onChange={(event) =>
                              updateSelectedExtra(extra.id, {
                                quantity: Math.max(1, Number(event.target.value))
                              })
                            }
                          />
                        </div>
                      )}
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removeSelectedExtra(extra.id)}
                        aria-label={t("labels.remove")}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {quote.selectedExtras.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  {t("labels.selectedServices")} — 0
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button className="flex-1" onClick={() => handleDownload("en")}>
              {t("labels.downloadEn")}
            </Button>
            <Button className="flex-1" onClick={() => handleDownload("de")}>
              {t("labels.downloadDe")}
            </Button>
            <Button className="flex-1" variant="outline" onClick={() => handleDownload(locale, true)}>
              {t("labels.previewPdf")}
            </Button>
          </div>
          </CardContent>
        </Card>

        <Card className="space-y-4">
          <CardHeader>
            <CardTitle><h2 className="text-lg font-semibold">{t("labels.breakdown")}</h2></CardTitle>
          </CardHeader>
          <CardContent>
          {calculated ? (
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                {calculated.items.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-start justify-between gap-3 border-b border-border pb-2"
                  >
                    <div>
                      <div className="font-medium">
                        {item.titleKey ? t(item.titleKey as any) : item.title}
                      </div>
                      <div className="text-xs text-muted-foreground">{item.pricingNotes}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">
                        {item.qty} × {formatCurrency(item.unitPrice, locale)}
                      </div>
                      <div className="font-semibold">
                        {formatCurrency(item.subtotal, locale)}
                      </div>
                    </div>
                  </div>
                ))}
                {calculated.commissionItems.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-start justify-between gap-3 border-b border-border pb-2"
                  >
                    <div>
                      <div className="font-medium">{t(item.titleKey as any)}</div>
                      <div className="text-xs text-muted-foreground">{item.ratePct}%</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrency(item.amount, locale)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3 text-base font-semibold">
                <span>{t("labels.total")}</span>
                <span>
                  {formatCurrency(calculated.total, locale)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-destructive">
              Проверьте, что введены корректные значения для людей и дней, и что
              прайс покрывает диапазон.
            </p>
          )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
