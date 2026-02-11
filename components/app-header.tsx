"use client";
import logoImage from "@/assets/Jinn Limited Stamp.png";
import Link from "next/link";
import { createT } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ThemeSwitch } from "./ThemeSwitch";
import { useLocale } from "@/components/locale-provider";

export default function AppHeader() {
  const { locale, setLocale } = useLocale();
  const t = createT(locale);

  return (
    <header className="sticky top-10 z-50 header-shell flex flex-col sm:flex-row gap-4 items-center justify-between bg-background/55 backdrop-blur-xl rounded-full border border-border shadow">
      <img src={logoImage.src} alt="Trip Quote Builder" className="w-16 h-16" />
      <nav className="flex gap-4 text-sm text-muted-foreground">
        <Link className="font-medium text-foreground data-[state=active]:text-accent" href="/quote">
          {t("nav.quote")}
        </Link>
        <Link className="font-medium text-foreground data-[state=active]:text-accent" href="/pricing">{t("nav.pricing")}</Link>
      </nav>
      <div className="flex items-center sm:self-center self-end gap-4 order-first sm:order-last">
        <ThemeSwitch />
        <div className="flex items-center gap-2 mr-4 text-sm">
          <Select value={locale} onValueChange={(value: string) => setLocale(value as Locale)}>
            <SelectTrigger className="h-8 w-[72px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">EN</SelectItem>
              <SelectItem value="de">DE</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
}
