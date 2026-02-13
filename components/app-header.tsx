"use client";
import logoImage from "@/assets/Jinn Limited Stamp.png";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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

type AppHeaderProps = {
  initialTheme: "light" | "dark";
};

export default function AppHeader({ initialTheme }: AppHeaderProps) {
  const { locale, setLocale } = useLocale();
  const t = createT(locale);
  const pathname = usePathname();
  const isQuotePage = pathname === "/quote";
  const isPricingPage = pathname === "/pricing";
  const navItems = [{ href: "/quote", label: t("nav.quote")}, { href: "/pricing", label: t("nav.pricing")}]

  return (
    <header className="sticky top-10 z-50 header-shell flex flex-col sm:flex-row gap-4 items-center justify-between bg-background/55 backdrop-blur-xl rounded-full border border-border shadow">
      <img src={logoImage.src} alt="Trip Quote Builder" className="w-16 h-16" />
      <nav className="flex gap-4 text-sm text-muted-foreground">
      {navItems.map((item) => (
        <Link
        key={item.href}
          href={item.href}
          className={cn("font-medium text-foreground rounded-md px-3 py-2 hover:bg-accent focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", pathname === item.href && "bg-accent text-accent-foreground")}
        >
          {item.label}
        </Link>
      ))}
      </nav>
      <div className="flex items-center sm:self-center self-end gap-4 order-first sm:order-last">
        <ThemeSwitch initialTheme={initialTheme} />
        <div className="flex items-center gap-2 mr-4 text-sm">
          <Select value={locale} onValueChange={(value: string) => setLocale(value as Locale)}>
            <SelectTrigger className="h-8 w-[72px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position = "item-aligned">
              <SelectItem value="en">EN</SelectItem>
              <SelectItem value="de">DE</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
}
