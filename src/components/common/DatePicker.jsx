"use client";

import * as React from "react";
import { id } from "date-fns/locale/id";
import { formatDate } from "@/lib/format";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toISODateString } from "@/lib/date";

/**
 * Komponen DatePicker dengan popover kalender dan format tanggal Indonesia
 * @param {{
 *   value?: string|Date,
 *   onChange: (isoDate: string) => void,
 *   placeholder?: string,
 *   className?: string,
 *   disabled?: boolean,
 *   id?: string
 * }} props
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "Pilih tanggal",
  className,
  disabled = false,
  id,
}) {
  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    const d = new Date(value);
    return isNaN(d.getTime()) ? undefined : d;
  }, [value]);

  const handleSelect = (date) => {
    if (date) {
      onChange(toISODateString(date));
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal bg-white border-slate-200 text-slate-800 hover:bg-slate-50",
            !value && "text-slate-400",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
          {selectedDate ? (
            formatDate(selectedDate)
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white shadow-xl rounded-xl border border-slate-100" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          initialFocus
          locale={id}
        />
      </PopoverContent>
    </Popover>
  );
}
