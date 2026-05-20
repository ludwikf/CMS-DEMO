"use client";
import * as React from "react";
import { Button } from "./button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  value: string | undefined;
  setValue: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  hideSearchInput?: boolean;
  disabled?: boolean;
  variant?: "outline" | "default";
}

export const Combobox: React.FC<ComboboxProps> = ({
  value,
  setValue,
  options,
  placeholder = "Wybierz wariant...",
  className,
  buttonClassName,
  hideSearchInput = false,
  disabled = false,
  variant = "default",
}) => {
  const [open, setOpen] = React.useState(false);
  const selectedLabel = value
    ? options.find((v) => v.value === value)?.label
    : undefined;

  const outlineClasses =
    "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-[6px] border border-[#bbb] dark:border-[#555] bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-[#222] dark:data-[placeholder]:text-[#999] focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1";

  const defaultClasses =
    "w-full justify-between bg-[#f1f1f1] hover:bg-[#e8e8e8] border-[#bbb] text-black dark:bg-[#333] dark:hover:bg-[#393939] dark:text-white dark:border-[#333]";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            variant === "outline" ? outlineClasses : defaultClasses,
            buttonClassName
          )}
        >
          <span className="overflow-hidden text-ellipsis whitespace-nowrap block w-full text-left">
            {selectedLabel ||
              (variant === "outline" ? (
                <span className="text-[#777] dark:text-[#999]">
                  {placeholder}
                </span>
              ) : (
                placeholder
              ))}
          </span>
          <ChevronsUpDown className="opacity-50 w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "z-[10000] w-[var(--radix-popover-trigger-width)] p-0 shadow-lg bg-white border-[#bbb] dark:bg-[#333] dark:border-[#444]",
          className
        )}
      >
        <Command className="bg-white dark:bg-[#333]">
          {!hideSearchInput && (
            <CommandInput placeholder="Szukaj wariantu..." className="h-9" />
          )}
          <CommandList>
            <CommandEmpty>Nie znaleziono wariantu.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    setValue(option.value);
                    setOpen(false);
                  }}
                >
                  {option.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
