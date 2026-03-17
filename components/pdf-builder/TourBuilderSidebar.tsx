"use client";

import { useTourBuilderStore } from "@/store/tourBuilderStore";
import { MAX_DAY_DESCRIPTION_CHARS } from "@/lib/pdf-builder/types";
import { ColorPicker } from "@/components/theme/ColorPicker";
import { FontPicker } from "@/components/theme/FontPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Plus, Trash2, ImagePlus, ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useRef } from "react";
import { useLocale } from "@/components/locale-provider";
import { createT } from "@/lib/i18n";
import type { DayAdditionalInfo } from "@/lib/pdf-builder/types";

function AdditionalInfoEditor({
  items,
  onChange,
  labelPlaceholder,
  valuePlaceholder
}: {
  items: DayAdditionalInfo[];
  onChange: (items: DayAdditionalInfo[]) => void;
  labelPlaceholder: string;
  valuePlaceholder: string;
}) {
  const { locale } = useLocale();
  const t = createT(locale);
  const update = (index: number, field: "label" | "value", value: string) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };
  const add = () => onChange([...items, { label: "", value: "" }]);
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-1">
          <Input
            value={item.label}
            onChange={(e) => update(i, "label", e.target.value)}
            placeholder={labelPlaceholder}
            className="flex-1 text-xs"
          />
          <Input
            value={item.value}
            onChange={(e) => update(i, "value", e.target.value)}
            placeholder={valuePlaceholder}
            className="flex-1 text-xs"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => remove(i)}
            aria-label="Удалить"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full" onClick={add}>
        <Plus className="mr-2 h-3.5 w-3.5" />
        {t("pdfBuilder.addButtonText")}
      </Button>
    </div>
  );
}

function StringListEditor({
  items,
  onChange,
  placeholder = "Пункт списка"
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  const update = (index: number, value: string) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };
  const add = () => onChange([...items, ""]);
  const remove = (index: number) =>
    onChange(items.filter((_, i) => i !== index));
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-1">
          <Input
            value={item}
            onChange={(e) => update(i, e.target.value)}
            placeholder={placeholder}
            className="flex-1 text-xs"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => remove(i)}
            aria-label="Удалить"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full" onClick={add}>
        <Plus className="mr-2 h-3.5 w-3.5" />
        Добавить
      </Button>
    </div>
  );
}

function ImageUpload({
  value,
  onChange,
  label
}: {
  value: string;
  onChange: (url: string) => void;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") onChange(result);
    };
    reader.onerror = () => {
      console.error("Ошибка чтения файла");
      e.target.value = "";
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="h-4 w-4" />
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="URL или загрузите файл"
          className="flex-1 text-xs"
        />
      </div>
    </div>
  );
}

export function TourBuilderSidebar() {
  const { locale } = useLocale();
  const t = createT(locale);
  const state = useTourBuilderStore();
  const {
    setColors,
    setFonts,
    setCover,
    setOverview,
    setInclusions,
    setTourManager,
    setPrice,
    setContact,
    setItineraryDay,
    addItineraryDay,
    removeItineraryDay,
    reorderItinerary,
    setOptionalExtension,
    setExtensionDay
  } = useTourBuilderStore();

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      <Accordion
        type="multiple"
        defaultValue={["colors", "fonts", "overview"]}
        className="space-y-0 rounded-lg border"
      >
        <AccordionItem value="colors" className="px-4">
          <AccordionTrigger className="hover:no-underline">Цвета</AccordionTrigger>
          <AccordionContent>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs text-muted-foreground">Акцент</Label>
              <div className="mt-1">
                <ColorPicker
                  label="Акцентный цвет"
                  value={state.colors.accent}
                  onChange={(v) => setColors({ accent: v })}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Текст</Label>
              <div className="mt-1">
                <ColorPicker
                  label="Цвет текста"
                  value={state.colors.text}
                  onChange={(v) => setColors({ text: v })}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Футер</Label>
              <div className="mt-1">
                <ColorPicker
                  label="Цвет футера"
                  value={state.colors.footer}
                  onChange={(v) => setColors({ footer: v })}
                />
              </div>
            </div>
          </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="fonts" className="px-4">
          <AccordionTrigger className="hover:no-underline">Шрифты</AccordionTrigger>
          <AccordionContent>
          <div className="py-2">
            <FontPicker
              heading={state.fonts.heading}
              body={state.fonts.body}
              onHeadingChange={(v) => setFonts({ heading: v })}
              onBodyChange={(v) => setFonts({ body: v })}
            />
          </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="cover" className="px-4">
          <AccordionTrigger className="hover:no-underline">Обложка</AccordionTrigger>
          <AccordionContent>
          <div className="space-y-3 py-2">
            <ImageUpload
              label="Лого (левый верх обложки)"
              value={state.cover.logoUrl ?? ""}
              onChange={(v) => setCover({ logoUrl: v })}
            />
            <div>
              <Label className="text-xs text-muted-foreground">Заголовок</Label>
              <Input
                value={state.cover.title}
                onChange={(e) => setCover({ title: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Шрифт заголовка</Label>
              <Select
                value={state.cover.titleFont ?? "Playfair Display"}
                onValueChange={(v) => setCover({ titleFont: v as import("@/lib/pdf-builder/types").FontCoverTitle })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Playfair Display",
                    "Cormorant Garamond",
                    "Lora",
                    "Merriweather",
                    "Aboreto",
                    "Cinzel",
                    "Raleway",
                    "Bebas Neue"
                  ].map((f) => (
                    <SelectItem key={f} value={f} style={{ fontFamily: f }}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Цвет заголовка</Label>
              <div className="mt-1">
                <ColorPicker
                  label="Цвет заголовка обложки"
                  value={state.cover.titleColor ?? "#ffffff"}
                  onChange={(v) => setCover({ titleColor: v })}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Стиль заголовка</Label>
              <Select
                value={state.cover.titleStyle ?? "uppercase"}
                onValueChange={(v) => setCover({ titleStyle: v as import("@/lib/pdf-builder/types").CoverTitleStyle })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Обычный</SelectItem>
                  <SelectItem value="uppercase">ВЕРХНИЙ РЕГИСТР</SelectItem>
                  <SelectItem value="lowercase">нижний регистр</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Насыщенность</Label>
              <Select
                value={state.cover.titleWeight ?? "700"}
                onValueChange={(v) => setCover({ titleWeight: v as import("@/lib/pdf-builder/types").CoverTitleWeight })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="400">Обычный</SelectItem>
                  <SelectItem value="600">Полужирный</SelectItem>
                  <SelectItem value="700">Жирный</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Межбуквенный интервал</Label>
              <Select
                value={state.cover.titleLetterSpacing ?? "wide"}
                onValueChange={(v) => setCover({ titleLetterSpacing: v as "normal" | "wide" | "extra-wide" })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Обычный</SelectItem>
                  <SelectItem value="wide">Широкий</SelectItem>
                  <SelectItem value="extra-wide">Очень широкий</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Подзаголовок</Label>
              <Input
                value={state.cover.subtitle}
                onChange={(e) => setCover({ subtitle: e.target.value })}
                className="mt-1"
              />
            </div>
            <ImageUpload
              label="Фоновое изображение"
              value={state.cover.backgroundImageUrl}
              onChange={(v) => setCover({ backgroundImageUrl: v })}
            />
          </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="overview" className="px-4">
          <AccordionTrigger className="hover:no-underline">Обзор тура</AccordionTrigger>
          <AccordionContent>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs text-muted-foreground">Заголовок</Label>
              <Input
                value={state.overview.title}
                onChange={(e) => setOverview({ title: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Даты</Label>
              <Input
                value={state.overview.dates}
                onChange={(e) => setOverview({ dates: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Extension Note</Label>
              <Input
                value={state.overview.extensionNote}
                onChange={(e) => setOverview({ extensionNote: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Приветственный текст</Label>
              <Textarea
                value={state.overview.welcomeText}
                onChange={(e) => setOverview({ welcomeText: e.target.value })}
                className="mt-1 min-h-[120px]"
                placeholder="Введите описание тура..."
              />
            </div>
          </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="highlights" className="px-4">
          <AccordionTrigger className="hover:no-underline">{t("pdfBuilder.tourHighlightsTitle")}</AccordionTrigger>
          <AccordionContent>
            <StringListEditor
              items={state.inclusions.highlights}
              onChange={(items) => setInclusions({ highlights: items })}
              placeholder="Highlight"
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="inclusions" className="px-4">
          <AccordionTrigger className="hover:no-underline">{t("pdfBuilder.tourInclusionsTitle")}</AccordionTrigger>
          <AccordionContent>
            <StringListEditor
              items={state.inclusions.included}
              onChange={(items) => setInclusions({ included: items })}
              placeholder="Что включено"
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="exclusions" className="px-4">
          <AccordionTrigger className="hover:no-underline">{t("pdfBuilder.tourExclusionsTitle")}</AccordionTrigger>
          <AccordionContent>
            <StringListEditor
              items={state.inclusions.excluded}
              onChange={(items) => setInclusions({ excluded: items })}
              placeholder="Что не включено"
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="tourManager" className="px-4">
          <AccordionTrigger className="hover:no-underline">{t("pdfBuilder.tourManagerTitle")}</AccordionTrigger>
          <AccordionContent>
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label className="text-sm">{t("pdfBuilder.tourManagerShow")}</Label>
              <Switch
                checked={state.tourManager.enabled !== false}
                onCheckedChange={(v) => setTourManager({ enabled: v })}
              />
            </div>
            <ImageUpload
              label={t("pdfBuilder.tourManagerAvatar")}
              value={state.tourManager.avatarUrl ?? ""}
              onChange={(v) => setTourManager({ avatarUrl: v })}
            />
            <div>
              <Label className="text-xs text-muted-foreground">{t("pdfBuilder.tourManagerName")}</Label>
              <Input
                value={state.tourManager.name}
                onChange={(e) => setTourManager({ name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t("pdfBuilder.tourManagerBio")}</Label>
              <Textarea
                value={state.tourManager.bio}
                onChange={(e) => setTourManager({ bio: e.target.value })}
                className="mt-1 min-h-[100px] text-xs"
              />
            </div>
          </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="contact" className="px-4">
          <AccordionTrigger className="hover:no-underline">{t("pdfBuilder.footerInfo")}</AccordionTrigger>
          <AccordionContent>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs text-muted-foreground">Phone</Label>
              <Input
                value={state.contact.phone}
                onChange={(e) => setContact({ phone: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input
                value={state.contact.email}
                onChange={(e) => setContact({ email: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Website</Label>
              <Input
                value={state.contact.website}
                onChange={(e) => setContact({ website: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="itinerary" className="px-4">
          <AccordionTrigger className="hover:no-underline">{t("pdfBuilder.dailyItineraryTitle")}</AccordionTrigger>
          <AccordionContent>
          <div className="space-y-2 py-2">
            {state.itinerary.map((day, index) => (
              <Card
                key={day.id}
                className="overflow-hidden"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const fromIndex = Number(e.dataTransfer.getData("text/plain"));
                  if (!Number.isNaN(fromIndex) && fromIndex !== index) {
                    reorderItinerary(fromIndex, index);
                  }
                }}
              >
                <CardHeader className="py-2 px-3">
                  <div className="flex items-center gap-1">
                    <div className="flex flex-col shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === 0}
                        onClick={() => reorderItinerary(index, index - 1)}
                        aria-label={t("pdfBuilder.moveUp")}
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === state.itinerary.length - 1}
                        onClick={() => reorderItinerary(index, index + 1)}
                        aria-label={t("pdfBuilder.moveDown")}
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div
                      className="shrink-0 cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-muted/50"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", String(index));
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      aria-label={t("pdfBuilder.dragToReorder")}
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-sm flex-1 min-w-0">{day.date || "Новый день"}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => removeItineraryDay(day.id)}
                      aria-label={t("pdfBuilder.deleteDay")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 px-3 pb-3 pt-0">
                  <Input
                    placeholder="Дата"
                    value={day.date}
                    onChange={(e) => setItineraryDay(day.id, { date: e.target.value })}
                    className="text-xs"
                  />
                  <Input
                    placeholder="Название дня"
                    value={day.title}
                    onChange={(e) => setItineraryDay(day.id, { title: e.target.value })}
                    className="text-xs"
                  />
                  <div>
                    <Label className="text-xs text-muted-foreground">{t("pdfBuilder.additionalInfo")}</Label>
                    <AdditionalInfoEditor
                      items={day.additionalInfo ?? []}
                      onChange={(items) => setItineraryDay(day.id, { additionalInfo: items })}
                      labelPlaceholder={t("pdfBuilder.addLabelPlaceholder")}
                      valuePlaceholder={t("pdfBuilder.addValuePlaceholder")}
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Описание"
                      value={day.description}
                      onChange={(e) =>
                        setItineraryDay(day.id, {
                          description: e.target.value.slice(0, MAX_DAY_DESCRIPTION_CHARS)
                        })
                      }
                      maxLength={MAX_DAY_DESCRIPTION_CHARS}
                      className="min-h-[60px] text-xs"
                    />
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {day.description.length}/{MAX_DAY_DESCRIPTION_CHARS}
                    </p>
                  </div>
                  <ImageUpload
                    label={t("pdfBuilder.image")}
                    value={day.imageUrl}
                    onChange={(v) => setItineraryDay(day.id, { imageUrl: v })}
                  />
                </CardContent>
              </Card>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => addItineraryDay()}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("pdfBuilder.addDayButtonText")}
            </Button>
          </div>
          </AccordionContent>
        </AccordionItem>

        {state.optionalExtension && (
          <AccordionItem value="extension" className="px-4">
            <AccordionTrigger className="hover:no-underline">Опциональное продолжение</AccordionTrigger>
            <AccordionContent>
            <div className="space-y-3 py-2">
              <div className="flex items-center justify-between rounded-md border p-3">
                <Label className="text-sm">Показывать опциональное продолжение</Label>
                <Switch
                  checked={state.optionalExtension.enabled !== false}
                  onCheckedChange={(v) =>
                    setOptionalExtension({ enabled: v })
                  }
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Заголовок</Label>
                <Input
                  value={state.optionalExtension.title}
                  onChange={(e) =>
                    setOptionalExtension({ title: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Вступление</Label>
                <Textarea
                  value={state.optionalExtension.intro}
                  onChange={(e) =>
                    setOptionalExtension({ intro: e.target.value })
                  }
                  className="mt-1 min-h-[80px] text-xs"
                />
              </div>
              {state.optionalExtension.days.map((day) => (
                <Card key={day.id} className="overflow-hidden">
                  <CardContent className="space-y-2 p-3">
                    <Input
                      placeholder="Дата"
                      value={day.date}
                      onChange={(e) =>
                        setExtensionDay(day.id, { date: e.target.value })
                      }
                      className="text-xs"
                    />
                    <Input
                      placeholder="Название"
                      value={day.title}
                      onChange={(e) =>
                        setExtensionDay(day.id, { title: e.target.value })
                      }
                      className="text-xs"
                    />
                    <div>
                      <Textarea
                        placeholder="Описание"
                        value={day.description}
                        onChange={(e) =>
                          setExtensionDay(day.id, {
                            description: e.target.value.slice(0, MAX_DAY_DESCRIPTION_CHARS)
                          })
                        }
                        maxLength={MAX_DAY_DESCRIPTION_CHARS}
                        className="min-h-[50px] text-xs"
                      />
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {day.description.length}/{MAX_DAY_DESCRIPTION_CHARS}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem value="price" className="px-4">
          <AccordionTrigger className="hover:no-underline">Цены</AccordionTrigger>
          <AccordionContent>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs text-muted-foreground">Основной тур</Label>
              <Input
                value={state.price.mainTitle}
                onChange={(e) => setPrice({ mainTitle: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Цена</Label>
              <Input
                value={state.price.mainPrice}
                onChange={(e) => setPrice({ mainPrice: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Single Supplement</Label>
              <Input
                value={state.price.mainSingleSupplement}
                onChange={(e) => setPrice({ mainSingleSupplement: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Extension Price</Label>
              <Input
                value={state.price.extensionPrice}
                onChange={(e) => setPrice({ extensionPrice: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Single Supplement</Label>
              <Input
                value={state.price.extensionSingleSupplement}
                onChange={(e) => setPrice({ extensionSingleSupplement: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Примечание о валюте</Label>
              <Textarea
                value={state.price.currencyNote}
                onChange={(e) => setPrice({ currencyNote: e.target.value })}
                className="mt-1 min-h-[60px] text-xs"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Примечание к скидке</Label>
              <Input
                value={state.price.discountNote ?? ""}
                onChange={(e) => setPrice({ discountNote: e.target.value })}
                className="mt-1 text-xs"
                placeholder="Discount Note"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Additional Notes</Label>
              <Textarea
                value={state.price.additionalNotes}
                onChange={(e) => setPrice({ additionalNotes: e.target.value })}
                className="mt-1 min-h-[120px] text-xs"
                placeholder="GROUP SIZE, CUSTOM OPTIONS, FITNESS NOTE, EXPERIENCE NOTE..."
              />
            </div>
          </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
