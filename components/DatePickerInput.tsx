"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { useLocale } from "@/components/locale-provider"

interface DatePickerInputProps {
  label: string
  value?: string // "YYYY-MM-DD"
  onChange?: (date: string) => void
}

function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function parseISODate(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const y = parseInt(match[1], 10)
  const m = parseInt(match[2], 10) - 1
  const d = parseInt(match[3], 10)
  const date = new Date(y, m, d)
  return isNaN(date.getTime()) ? null : date
}

function formatDate(date: Date | undefined, locale: "en" | "de") {
  if (!date) return ""
  const localeId = locale === "en" ? "en-US" : "de-DE"
  return date.toLocaleDateString(localeId, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function isValidDate(date: Date | undefined): boolean {
  return !!date && !isNaN(date.getTime())
}

export function DatePickerInput({ label, value, onChange }: DatePickerInputProps) {
  const { locale } = useLocale()

  const getInitialDate = () => {
    if (value) {
      const d = parseISODate(value) ?? new Date(value)
      if (d && !isNaN(d.getTime())) return d
    }
    return new Date()
  }

  const [date, setDate] = React.useState<Date | undefined>(getInitialDate)
  const [month, setMonth] = React.useState<Date | undefined>(date)
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    if (value) {
      const d = parseISODate(value) ?? new Date(value)
      if (d && !isNaN(d.getTime())) {
        setDate(d)
      } else {
        const today = new Date()
        setDate(today)
        onChange?.(toISODate(today))
      }
    } else {
      const today = new Date()
      setDate(today)
      onChange?.(toISODate(today))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onChange is stable from parent
  }, [value])

  const handleSelect = (newDate: Date | undefined) => {
    setDate(newDate)
    if (newDate) onChange?.(toISODate(newDate))
  }

  const displayValue = date ? formatDate(date, locale) : (value ?? "")

  return (
    <Field>
      <FieldLabel htmlFor="date-required">{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id="date-required"
          value={displayValue}
          placeholder={formatDate(new Date(), locale)}
          onChange={(e) => {
            const raw = e.target.value.trim()
            if (!raw) {
              const today = new Date()
              setDate(today)
              onChange?.(toISODate(today))
              return
            }
            const parsed = new Date(raw)
            if (isValidDate(parsed)) {
              handleSelect(parsed)
            } else {
              setDate(undefined)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setOpen(true)
            }
          }}
        />
        <InputGroupAddon align="inline-end">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <InputGroupButton
                id="date-picker"
                variant="ghost"
                size="icon-xs"
                aria-label="Select date"
              >
                <CalendarIcon />
                <span className="sr-only">Select date</span>
              </InputGroupButton>
            </PopoverTrigger>
            <PopoverContent
              className="w-full p-3"
              align="end"
              alignOffset={-8}
              sideOffset={10}
            >
              <Calendar
                mode="single"
                selected={date}
                month={month}
                onMonthChange={setMonth}
                onSelect={(d) => {
                  handleSelect(d)
                  setOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  )
}
