"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { FontHeading, FontBody } from "@/lib/pdf-builder/types";

const HEADING_FONTS: { value: FontHeading; label: string }[] = [
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Cormorant Garamond", label: "Cormorant Garamond" },
  { value: "Lora", label: "Lora" },
  { value: "Merriweather", label: "Merriweather" },
  { value: "Aboreto", label: "Aboreto" },
  { value: "Cinzel", label: "Cinzel" },
  { value: "Raleway", label: "Raleway" },
  { value: "Bebas Neue", label: "Bebas Neue" }
];

const BODY_FONTS: { value: FontBody; label: string }[] = [
  { value: "Inter", label: "Inter" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Source Sans 3", label: "Source Sans 3" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Raleway", label: "Raleway" },
  { value: "Lato", label: "Lato" },
  { value: "Nunito", label: "Nunito" }
];

interface FontPickerProps {
  heading: FontHeading;
  body: FontBody;
  onHeadingChange: (v: FontHeading) => void;
  onBodyChange: (v: FontBody) => void;
}

export function FontPicker({
  heading,
  body,
  onHeadingChange,
  onBodyChange
}: FontPickerProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-muted-foreground">Заголовки</Label>
        <Select value={heading} onValueChange={(v) => onHeadingChange(v as FontHeading)}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HEADING_FONTS.map((f) => (
              <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Основной текст</Label>
        <Select value={body} onValueChange={(v) => onBodyChange(v as FontBody)}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BODY_FONTS.map((f) => (
              <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
