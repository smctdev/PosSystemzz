"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Employee } from "@/lib/api/types";

export interface EmployeeComboboxProps {
  employees: Employee[];
  value: string;
  onValueChange: (employeeId: string) => void;
  disabled?: boolean;
  id?: string;
  label?: string;
  loading?: boolean;
}

export function EmployeeCombobox({
  employees,
  value,
  onValueChange,
  disabled,
  id = "employee-combobox",
  label = "Recorded by",
  loading,
}: EmployeeComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => employees.find((e) => String(e.id) === value),
    [employees, value]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.role && e.role.toLowerCase().includes(q))
    );
  }, [employees, search]);

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
      setSearch(selected?.name ?? "");
    }
  }, [open, selected]);

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
          placeholder={loading ? "Loading staff…" : "Search employee…"}
          value={open ? search : selected?.name ?? ""}
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
                No employee found.
              </li>
            ) : (
              filtered.map((e) => (
                <li
                  key={e.id}
                  role="option"
                  aria-selected={String(e.id) === value}
                  className={cn(
                    "cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                    String(e.id) === value && "bg-accent/60"
                  )}
                  onMouseDown={(ev) => {
                    ev.preventDefault();
                    onValueChange(String(e.id));
                    setSearch(e.name);
                    setOpen(false);
                  }}
                >
                  <span className="font-medium">{e.name}</span>
                  {e.role ? (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({e.role})
                    </span>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
