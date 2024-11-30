import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import { Button } from "./button";
import { Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

interface DatePickerProps {
    date: Date | undefined;
    onSelect: (date: Date | undefined) => void;
    className?: string;
  }

export function DatePicker({ date, onSelect, className }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-start text-left font-normal ${className}`}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <DayPicker
          mode="single"
          selected={date}
          onSelect={onSelect}
        />
      </PopoverContent>
    </Popover>
  )
}