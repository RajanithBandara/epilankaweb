"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type DatePickerProps = {
  date: Date
  onDateChange: (date: Date) => void
  placeholder?: string
  className?: string
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
}: DatePickerProps) {

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal border-default bg-[var(--dash-input-bg)] text-[var(--dash-text-primary)] hover:border-primary transition-all",
            !date && "opacity-70",
            className
          )}
        >
          <CalendarIcon className="size-4 mr-2 text-primary" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border border-default shadow-xl rounded-xl z-50 overflow-hidden" style={{ backgroundColor: 'var(--dash-card-bg)', color: 'var(--dash-text-primary)' }} align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(value) => value && onDateChange(value)}
          required
        />
      </PopoverContent>
    </Popover>
  )
}