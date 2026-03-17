"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Palette } from "lucide-react";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 font-normal"
        >
          <div
            className="h-4 w-4 rounded border shrink-0"
            style={{ backgroundColor: value }}
          />
          <span className="truncate">{value}</span>
          <Palette className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="space-y-3">
          <Label>{label}</Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border border-input bg-transparent p-1"
            />
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#CBAF87"
              className="font-mono text-sm"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
