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
  const initialLocale = localeValue === "de" ? "de" : "en";

  return (
    <html lang={initialLocale} suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap"
        />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LocaleProvider initialLocale={initialLocale}>
            <AppHeader />
            <main className="container-shell">{children}</main>
            <Toaster richColors position="bottom-center" />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
