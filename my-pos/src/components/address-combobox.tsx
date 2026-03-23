"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface AddressComboboxProps {
  options: string[];
  value: string;
  onValueChange: (address: string) => void;
  disabled?: boolean;
  id?: string;
  label?: string;
  loading?: boolean;
  placeholder?: string;
}

export function AddressCombobox({
  options,
  value,
  onValueChange,
  disabled,
  id = "address-combobox",
  label = "Address",
  loading,
  placeholder = "Search address…",
}: AddressComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((addr) => addr.toLowerCase().includes(q));
  }, [options, search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setSearch(value || "");
    }
  }, [open, value]);

  const isDisabled = disabled || loading;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative" ref={containerRef}>
        <Input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-busy={loading}
          autoComplete="off"
          disabled={isDisabled}
          placeholder={loading ? "Loading…" : placeholder}
          value={open ? search : value}
          onChange={(e) => {
            setSearch(e.target.value);
            onValueChange("");
            if (!open) setOpen(true);
          }}
          onFocus={() => !isDisabled && setOpen(true)}
          className="w-full"
        />
        {open && !isDisabled && (
          <ul
            className="absolute z-[60] mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md"
            role="listbox"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                No address matches. Try another search.
              </li>
            ) : (
              filtered.map((addr) => (
                <li
                  key={addr}
                  role="option"
                  aria-selected={value === addr}
                  className={cn(
                    "cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                    value === addr && "bg-accent/60"
                  )}
                  onMouseDown={(ev) => {
                    ev.preventDefault();
                    onValueChange(addr);
                    setSearch(addr);
                    setOpen(false);
                  }}
                >
                  {addr}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
