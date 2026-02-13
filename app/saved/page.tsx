"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { Trash2 } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { createT } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { ColumnDef, Row } from "@tanstack/react-table";

type SavedPdf = {
  quoteNumber: string;
  hasEn: boolean;
  hasDe: boolean;
  clientName: string;
  date: string;
};

export default function SavedPdfsPage() {
  const { locale } = useLocale();
  const t = createT(locale);
  const [files, setFiles] = useState<SavedPdf[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");

  const fetchFiles = async () => {
    setLoading(true);
    const res = await fetch("/api/pdf/files");
    const data = await res.json();
    setFiles(data.files ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDownload = useCallback((quoteNumber: string, lang: "en" | "de") => {
    const url = `/api/pdf/files?quoteNumber=${encodeURIComponent(quoteNumber)}&locale=${lang}`;
    const link = document.createElement("a");
    link.href = url;
    link.download = `${lang === "de" ? "Angebot" : "Quote"}_${quoteNumber}_${lang.toUpperCase()}.pdf`;
    link.click();
  }, []);

  const handlePreview = useCallback(async (quoteNumber: string) => {
    const url = `/api/pdf/files?quoteNumber=${encodeURIComponent(quoteNumber)}&locale=${locale}`;
    const res = await fetch(url);
    if (!res.ok) return;
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    window.open(objectUrl, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  }, [locale]);

  const handleDelete = useCallback(async (quoteNumber: string) => {
    const res = await fetch(
      `/api/pdf/files?quoteNumber=${encodeURIComponent(quoteNumber)}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      toast.error(t("toast.pdfSaveFailed"));
      return;
    }
    toast.success(t("toast.pdfDeleted"));
    setFiles((prev) => prev.filter((f) => f.quoteNumber !== quoteNumber));
  }, [t]);

  const columns = useMemo<ColumnDef<SavedPdf>[]>(
    () => [
      {
        accessorKey: "quoteNumber",
        header: t("savedPdfs.colQuoteNumber"),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.quoteNumber}</span>
        )
      },
      {
        accessorKey: "clientName",
        header: t("savedPdfs.colClient"),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.clientName || "—"}
          </span>
        )
      },
      {
        accessorKey: "date",
        header: t("savedPdfs.colDate"),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.date
              ? formatDate(row.original.date, locale)
              : "—"}
          </span>
        )
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              {(locale === "en" ? item.hasEn : item.hasDe) && (
                <Button
                  variant="outline"
                  onClick={() => handlePreview(item.quoteNumber)}
                >
                  {t("labels.preview")}
                </Button>
              )}
              <Select
                onValueChange={(value: "en" | "de") =>
                  handleDownload(item.quoteNumber, value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("labels.download")} />
                </SelectTrigger>
                <SelectContent position="item-aligned">
                  {item.hasEn && <SelectItem value="en">EN</SelectItem>}
                  {item.hasDe && <SelectItem value="de">DE</SelectItem>}
                </SelectContent>
              </Select>
              <ConfirmDialog
                trigger={
                  <Button
                    variant="destructive"
                    size="icon"
                    aria-label={t("labels.remove")}
                    className="flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                }
                title={t("dialog.deletePdfTitle")}
                description={t("dialog.deletePdfDescription")}
                cancelLabel={t("dialog.cancel")}
                confirmLabel={t("dialog.delete")}
                variant="destructive"
                onConfirm={() => handleDelete(item.quoteNumber)}
              />
            </div>
          );
        }
      }
    ],
    [t, locale, handlePreview, handleDownload, handleDelete]
  );

  const globalFilterFn = useCallback(
    (row: Row<SavedPdf>, filterValue: string) => {
      if (!filterValue.trim()) return true;
      const v = filterValue.toLowerCase().trim();
      const { quoteNumber, clientName, date } = row.original;
      const dateFormatted = date ? formatDate(date, locale) : "";
      return (
        (quoteNumber || "").toLowerCase().includes(v) ||
        (clientName || "").toLowerCase().includes(v) ||
        (date || "").toLowerCase().includes(v) ||
        dateFormatted.toLowerCase().includes(v)
      );
    },
    [locale]
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-8 pt-8">
      <div className="flex-shrink-0">
        <h1 className="text-2xl font-semibold">{t("savedPdfs.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("savedPdfs.subtitle")}</p>
      </div>
      <DataTable
        columns={columns}
        data={files}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder={t("savedPdfs.searchPlaceholder")}
        emptyMessage={t("savedPdfs.empty")}
        globalFilterFn={globalFilterFn}
        className="flex-1 min-h-0"
        rowsPerPageLabel={t("savedPdfs.rowsPerPage")}
        previousLabel={t("savedPdfs.previous")}
        nextLabel={t("savedPdfs.next")}
        pageOfLabel={(page, total) =>
          t("savedPdfs.pageOf").replace("{page}", String(page)).replace("{total}", String(total))
        }
      />
    </div>
  );
}
