"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { useTourBuilderStore } from "@/store/tourBuilderStore";
import {
  getDrafts,
  saveDraft,
  loadDraft,
  deleteDraft,
  getSerializableState,
  exportConfigToFile,
  parseConfigFile,
  type TourDraft
} from "@/lib/pdf-builder/drafts";
import { Save, FolderOpen, Trash2, Download, Upload, Server } from "lucide-react";
import { toast } from "sonner";

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return iso;
  }
}

type ServerDraft = { filename: string; name: string; createdAt: string };

export function DraftsPanel() {
  const [drafts, setDrafts] = useState<TourDraft[]>([]);
  const [serverDrafts, setServerDrafts] = useState<ServerDraft[]>([]);
  const [saveName, setSaveName] = useState("");
  const [open, setOpen] = useState(false);
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);
  const [deleteServerDialogOpen, setDeleteServerDialogOpen] = useState(false);
  const [deleteTargetFilename, setDeleteTargetFilename] = useState<string | null>(null);
  const [pendingSave, setPendingSave] = useState<{
    draft: TourDraft;
    existingFilename: string;
  } | null>(null);
  const loadState = useTourBuilderStore((s) => s.loadState);
  const importInputRef = useRef<HTMLInputElement>(null);

  const refreshDrafts = () => setDrafts(getDrafts());

  const fetchServerDrafts = async () => {
    try {
      const res = await fetch("/api/pdf-builder/drafts");
      const data = await res.json();
      setServerDrafts(data.drafts ?? []);
    } catch {
      setServerDrafts([]);
    }
  };

  useEffect(() => {
    refreshDrafts();
    if (open) fetchServerDrafts();
  }, [open]);

  const handleExportConfig = () => {
    const state = useTourBuilderStore.getState();
    const serializable = getSerializableState(state);
    exportConfigToFile(serializable, state.cover.title);
    toast.success("Конфиг скачан");
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const state = parseConfigFile(text);
      if (state) {
        loadState(state);
        setOpen(false);
        toast.success("Конфиг загружен");
      } else {
        toast.error("Неверный формат файла");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const saveToServer = async (draft: TourDraft) => {
    const res = await fetch("/api/pdf-builder/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: draft.id,
        name: draft.name,
        createdAt: draft.createdAt,
        state: draft.state
      })
    });
    if (!res.ok) throw new Error("API error");
  };

  const handleSave = async () => {
    const state = useTourBuilderStore.getState();
    const serializable = getSerializableState(state);
    let draft: TourDraft;
    try {
      draft = saveDraft(saveName, serializable);
    } catch (e) {
      if (e instanceof Error && e.message === "QUOTA_EXCEEDED") {
        toast.error(
          "Недостаточно места в браузере. Удалите старые черновики или используйте «Скачать» для сохранения конфига."
        );
        return;
      }
      throw e;
    }
    const draftForServer: TourDraft = { ...draft, state: serializable };
    setSaveName("");
    refreshDrafts();

    const list = await (async () => {
      try {
        const res = await fetch("/api/pdf-builder/drafts");
        const data = await res.json();
        return data.drafts ?? [];
      } catch {
        return [];
      }
    })();

    const existing = list.find(
      (d: ServerDraft) => d.name.trim().toLowerCase() === draft.name.trim().toLowerCase()
    );

    if (existing) {
      setPendingSave({ draft: draftForServer, existingFilename: existing.filename });
      setReplaceDialogOpen(true);
      return;
    }

    setOpen(false);
    try {
      await saveToServer(draftForServer);
      toast.success("Черновик сохранён");
    } catch {
      toast.error("Черновик сохранён в браузере, но не на сервере");
    }
  };

  const handleReplaceConfirm = async () => {
    if (!pendingSave) return;
    const { draft, existingFilename } = pendingSave;
    setReplaceDialogOpen(false);
    setPendingSave(null);
    setOpen(false);
    try {
      await fetch(`/api/pdf-builder/drafts?filename=${encodeURIComponent(existingFilename)}`, {
        method: "DELETE"
      });
      await saveToServer(draft);
      toast.success("Черновик заменён");
    } catch {
      toast.error("Не удалось заменить черновик");
    }
  };

  const handleKeepBoth = async () => {
    if (!pendingSave) return;
    const { draft } = pendingSave;
    setReplaceDialogOpen(false);
    setPendingSave(null);
    setOpen(false);
    const draftWithCopy = { ...draft, name: `${draft.name} (копия)` };
    try {
      await saveToServer(draftWithCopy);
      toast.success("Черновик сохранён как копия");
    } catch {
      toast.error("Черновик сохранён в браузере, но не на сервере");
    }
  };

  const handleLoad = (id: string) => {
    const state = loadDraft(id);
    if (state) {
      loadState(state);
      setOpen(false);
      toast.success("Черновик загружен");
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      deleteDraft(id);
      refreshDrafts();
      toast.success("Черновик удалён");
    } catch (err) {
      if (err instanceof Error && err.message === "QUOTA_EXCEEDED") {
        toast.error("Недостаточно места в браузере. Удалите черновики вручную.");
      }
    }
  };

  const handleDeleteServer = (e: React.MouseEvent, filename: string) => {
    e.stopPropagation();
    setDeleteTargetFilename(filename);
    setDeleteServerDialogOpen(true);
  };

  const handleDeleteServerConfirm = async () => {
    if (!deleteTargetFilename) return;
    try {
      const res = await fetch(
        `/api/pdf-builder/drafts?filename=${encodeURIComponent(deleteTargetFilename)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Delete failed");
      setServerDrafts((prev) => prev.filter((d) => d.filename !== deleteTargetFilename));
      setDeleteServerDialogOpen(false);
      setDeleteTargetFilename(null);
      toast.success("Черновик удалён с сервера");
    } catch {
      toast.error("Не удалось удалить черновик");
    }
  };

  const handleLoadServer = async (filename: string) => {
    try {
      const res = await fetch(
        `/api/pdf-builder/drafts?filename=${encodeURIComponent(filename)}`
      );
      if (!res.ok) throw new Error("Load failed");
      const data = await res.json();
      if (data?.state) {
        loadState(data.state);
        setOpen(false);
        toast.success("Черновик с сервера загружен");
      } else {
        toast.error("Неверный формат");
      }
    } catch {
      toast.error("Не удалось загрузить черновик");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <FolderOpen className="mr-2 h-4 w-4" />
          Черновики
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-h-[85vh] overflow-y-auto" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Файл конфига (не теряется при очистке кэша)</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleExportConfig}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Скачать
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => importInputRef.current?.click()}
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Загрузить
              </Button>
              <input
                ref={importInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleImportConfig}
              />
            </div>
          </div>
          <div className="space-y-2 border-t pt-3">
            <Label className="text-xs text-muted-foreground">Черновики (в браузере)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Название черновика"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                className="text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
              <Button size="sm" onClick={handleSave}>
                <Save className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="border-t pt-3">
            <Label className="text-xs text-muted-foreground">Загрузить черновик</Label>
            {drafts.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Нет сохранённых черновиков</p>
            ) : (
              <ul className="mt-2 max-h-32 overflow-y-auto space-y-1">
                {drafts.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-2 rounded-md p-2 hover:bg-muted/50 cursor-pointer group"
                    onClick={() => handleLoad(d.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(d.createdAt)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0"
                      onClick={(e) => handleDelete(e, d.id)}
                      aria-label="Удалить"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t pt-3">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5" />
              Черновики на сервере (data/pdf-builder)
            </Label>
            {serverDrafts.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Нет черновиков на сервере</p>
            ) : (
              <ul className="mt-2 max-h-32 overflow-y-auto space-y-1">
                {serverDrafts.map((d) => (
                  <li
                    key={d.filename}
                    className="flex items-center justify-between gap-2 rounded-md p-2 hover:bg-muted/50 cursor-pointer group"
                    onClick={() => handleLoadServer(d.filename)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{d.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.createdAt ? formatDate(d.createdAt) : d.filename}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0"
                      onClick={(e) => handleDeleteServer(e, d.filename)}
                      aria-label="Удалить с сервера"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </PopoverContent>

      <AlertDialog open={replaceDialogOpen} onOpenChange={setReplaceDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Файл с таким именем существует</AlertDialogTitle>
            <AlertDialogDescription>
              Заменить существующий черновик или оставить оба (новый сохранится как копия)?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" onClick={handleKeepBoth}>
                Оставить оба
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleReplaceConfirm} autoFocus>
              Заменить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteServerDialogOpen}
        onOpenChange={(open) => {
          setDeleteServerDialogOpen(open);
          if (!open) setDeleteTargetFilename(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить черновик с сервера?</AlertDialogTitle>
            <AlertDialogDescription>
              Файл будет удалён из data/pdf-builder. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteServerConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Popover>
  );
}
