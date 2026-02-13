"use client";

import * as React from "react";
import { useLocale } from "@/components/locale-provider";
import { createT } from "@/lib/i18n";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Minus, Plus } from "lucide-react";

interface NumberStepperProps {
  value: number;
  size?: "xs" | "sm" | "lg";
  buttonSize?: "xs" | "sm" | "icon-xs" | "icon-sm";
  buttonVariant?: "outline" | "ghost" | "default" | "secondary" | "destructive" | "link";
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function NumberStepper({
  value,
  size = "sm",
  buttonSize = "icon-xs", 
  buttonVariant = "outline",
  onChange,
  min = 0,
  max = 99,
  step = 1,
}: NumberStepperProps) {
  const { locale } = useLocale();
  const t = createT(locale);
  const handleDecrement = () => onChange(Math.max(min, value - step));
  const handleIncrement = () => onChange(Math.min(max, value + step));

  return (
    <InputGroup size={size}>
      <InputGroupInput
        type="number"
        value={value}
        onChange={(e) => {
          const v = e.target.value === "" ? min : Number(e.target.value);
          onChange(Math.max(min, Math.min(max, v)));
        }}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          type="button"
          size={buttonSize}
          variant={buttonVariant}
          className="rounded-full"
          onClick={handleDecrement}
          disabled={value <= min}
          aria-label={t("aria.decrease")}
        >
          <Minus className="size-4" />
        </InputGroupButton>
        <InputGroupButton
          type="button"
          size={buttonSize}
          variant={buttonVariant}
          className="rounded-full disabled:pointer-events-auto disabled:cursor-not-allowed disabled:hover:bg-transparent"
          onClick={handleIncrement}
          disabled={value >= max}
          aria-label={t("aria.increase")}
        >
          <Plus className="size-4" />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}