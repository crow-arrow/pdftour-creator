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

function useNumberInput(
  value: number | null,
  min: number,
  max: number,
  onChange: (v: number | null) => void,
  allowNull: boolean
) {
  const [display, setDisplay] = React.useState(() =>
    value === null ? "" : String(value)
  );
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    if (!focused) setDisplay(value === null ? "" : String(value));
  }, [value, focused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplay(raw);
    if (raw === "") {
      if (allowNull) onChange(null);
      return;
    }
    const n = Number(raw);
    if (!Number.isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
  };

  const handleBlur = () => {
    setFocused(false);
    if (display === "") {
      if (allowNull) {
        setDisplay("");
        onChange(null);
      } else {
        setDisplay(String(min));
        onChange(min);
      }
    }
  };

  const commitValue = (v: number | null) => {
    setDisplay(v === null ? "" : String(v));
  };

  return {
    display,
    onFocus: () => setFocused(true),
    onBlur: handleBlur,
    onChange: handleChange,
    commitValue,
  };
}

interface NumberStepperProps {
  value: number | null;
  size?: "xs" | "sm" | "lg";
  buttonSize?: "xs" | "sm" | "icon-xs" | "icon-sm";
  buttonVariant?: "outline" | "ghost" | "default" | "secondary" | "destructive" | "link";
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  allowNull?: boolean;
  nullPlaceholder?: string;
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
  allowNull = false,
  nullPlaceholder = "+",
}: NumberStepperProps) {
  const { locale } = useLocale();
  const t = createT(locale);
  const { display, onFocus, onBlur, onChange: handleChange, commitValue } =
    useNumberInput(value, min, max, onChange, allowNull);
  const numValue = value ?? min;

  const handleDecrement = () => {
    if (value === null) return; // уже «без ограничения»
    if (value <= min) {
      if (allowNull) {
        onChange(null);
        commitValue(null);
      }
    } else {
      const v = Math.max(min, value - step);
      onChange(v);
      commitValue(v);
    }
  };

  const handleIncrement = () => {
    if (value === null) {
      onChange(min);
      commitValue(min);
    } else {
      const v = Math.min(max, value + step);
      onChange(v);
      commitValue(v);
    }
  };

  return (
    <InputGroup size={size}>
      <InputGroupInput
        type="number"
        min={min}
        max={max}
        value={display}
        placeholder={allowNull ? nullPlaceholder : undefined}
        onFocus={onFocus}
        onBlur={onBlur}
        onChange={handleChange}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          type="button"
          size={buttonSize}
          variant={buttonVariant}
          className="rounded-full"
          onClick={handleDecrement}
          disabled={
            value === null || (value <= min && !allowNull)
          }
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
          disabled={value !== null && value >= max}
          aria-label={t("aria.increase")}
        >
          <Plus className="size-4" />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}