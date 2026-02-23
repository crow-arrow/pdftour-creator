"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

interface NumberInputProps
  extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
}

/** Позволяет пустое значение при редактировании; при blur подставляет min (или 0). */
export function NumberInput({
  value,
  onChange,
  min = 0,
  ...props
}: NumberInputProps) {
  const [display, setDisplay] = React.useState(() => String(value));
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    if (!focused) setDisplay(String(value));
  }, [value, focused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplay(raw);
    if (raw === "") return;
    const n = Number(raw);
    if (!Number.isNaN(n)) {
      const clamped = Math.max(min, n);
      onChange(clamped);
      if (clamped !== n) setDisplay(String(clamped));
    }
  };

  const handleBlur = () => {
    setFocused(false);
    if (display === "") {
      setDisplay(String(min));
      onChange(min);
    } else {
      const n = Number(display);
      if (!Number.isNaN(n)) onChange(Math.max(min, n));
    }
  };

  return (
    <Input
      type="number"
      min={min}
      value={display}
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
      onChange={handleChange}
      {...props}
    />
  );
}

