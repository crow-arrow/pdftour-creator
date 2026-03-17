"use client";

import { useTourBuilderStore } from "@/store/tourBuilderStore";
import { TourTemplate } from "@/lib/pdf-builder/tourTemplate";
import { TourBuilderSidebar } from "@/components/pdf-builder/TourBuilderSidebar";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DraftsPanel } from "@/components/pdf-builder/DraftsPanel";
import { useLocale } from "@/components/locale-provider";

export default function PdfBuilderPage() {
  const { locale } = useLocale();
  const state = useTourBuilderStore();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/pdf/tour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, locale })
      });
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tour-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF загружен");
    } catch (err) {
      toast.error("Ошибка генерации PDF");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <h1 className="text-lg font-semibold">PDF Builder</h1>
        <div className="flex items-center gap-2">
          <DraftsPanel />
          <Button onClick={handleDownload} disabled={isGenerating}>
          {isGenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Download PDF
        </Button>
        </div>
      </div>

      <ResizablePanelGroup
        orientation="horizontal"
        className="flex-1 min-h-0"
      >
        <ResizablePanel id="sidebar" defaultSize="28%" minSize="280px" maxSize="45%">
          <div className="h-full overflow-y-auto border-r border-border bg-muted/30">
            <TourBuilderSidebar />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel id="preview" defaultSize="72%" minSize="55%">
          <div className="h-full overflow-auto bg-background">
            <div className="mx-auto max-w-[210mm] min-h-full bg-white shadow-xl">
              <TourTemplate state={state} />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
