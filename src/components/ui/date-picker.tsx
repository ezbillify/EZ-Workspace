/*
 * Copyright (c) 2026 EZBillify Ventures Pvt Ltd. All rights reserved.
 * Licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).
 * 
 * WARNING & LIABILITY DISCLAIMER:
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * 
 * IMPORTANT: WHOEVER COPIES, REDISTRIBUTES, OR USES THIS SOFTWARE MUST KNOW THAT
 * UNDER NO CIRCUMSTANCES CAN THEY RECOVER DAMAGES, LOSSES, OR LIABILITIES
 * ENCOUNTERED FROM THE USE, MODIFICATION, OR DISTRIBUTION OF THIS SOFTWARE.
 */

"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DatePickerProps {
  value?: string;                              // ISO date string ("YYYY-MM-DD")
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Lock the popover to a specific alignment. Defaults to "start". */
  align?: "start" | "center" | "end";
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = "Pick a date",
  disabled,
  className,
  align = "start",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = value ? new Date(value) : undefined;

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      {label && (
        <Label className="text-xs font-medium text-foreground">{label}</Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start font-normal",
              !selected && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="size-4 shrink-0" />
            <span className="truncate">
              {selected ? format(selected, "PPP") : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected ?? new Date()}
            onSelect={(date) => {
              if (date) {
                onChange(format(date, "yyyy-MM-dd"));
                setOpen(false);
              }
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
