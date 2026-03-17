import "./globals.css";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import AppHeader from "@/components/app-header";
import { LocaleProvider } from "@/components/locale-provider";
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Trip Quote Builder",
  description: "MVP for trip proposal and PDF generation"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const localeValue = cookieStore.get("locale")?.value;
  const themeValue = cookieStore.get("theme")?.value;
  const initialLocale = localeValue === "de" ? "de" : "en";
  const initialTheme = themeValue === "dark" ? "dark" : "light";

  return (
    <html lang={initialLocale} suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&family=Montserrat:wght@400;500;600;700&family=Cormorant+Garamond:wght@400;500;600;700&family=Lora:wght@400;500;600;700&family=Merriweather:wght@400;700&family=Source+Sans+3:wght@400;500;600;700&family=Open+Sans:wght@400;500;600;700&family=Aboreto&family=Cinzel:wght@400;600;700&family=Raleway:wght@400;500;600;700&family=Bebas+Neue&family=Lato:wght@400;600;700&family=Nunito:wght@400;600;700&display=swap"
        />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme={initialTheme || "system"}
          enableSystem
          disableTransitionOnChange
        >
          <LocaleProvider initialLocale={initialLocale}>
            <div className="h-screen flex flex-col">
              <AppHeader initialTheme={initialTheme} />
              <main className="container-shell flex flex-col flex-1 min-h-0">{children}</main>
            </div>
            <Toaster richColors position="bottom-center" />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
