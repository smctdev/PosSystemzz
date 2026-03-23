"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Briefcase,
  Hash,
  MapPin,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Employee } from "@/lib/api/types";

export interface ViewEmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (
      parts[0][0] + parts[parts.length - 1][0]
    ).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

function DetailRow({
  icon: Icon,
  label,
  children,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-4 px-4 py-3.5 sm:px-5",
        className
      )}
    >
      <div
        className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
        aria-hidden
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="text-sm text-foreground">{children}</div>
      </div>
    </div>
  );
}

export function ViewEmployeeModal({
  open,
  onOpenChange,
  employee,
}: ViewEmployeeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        {employee ? (
          <>
            <div className="relative border-b bg-gradient-to-br from-primary/12 via-primary/5 to-transparent px-6 pb-6 pt-8 pr-14 sm:pr-16">
              <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-5">
                <Avatar className="size-16 border-2 border-background shadow-md ring-1 ring-border/60 sm:size-[4.5rem]">
                  <AvatarFallback className="rounded-full bg-primary/15 text-lg font-semibold text-primary sm:text-xl">
                    {initialsFromName(employee.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="mt-4 min-w-0 flex-1 sm:mt-1">
                  <DialogHeader className="space-y-1 text-center sm:text-left sm:pr-8">
                    <DialogTitle className="text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
                      {employee.name}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                      Staff profile · read only
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                    <Badge
                      variant="secondary"
                      className="font-mono text-xs font-normal tabular-nums"
                    >
                      <Hash className="mr-1 size-3 opacity-70" />
                      {employee.id}
                    </Badge>
                    {employee.role ? (
                      <Badge variant="outline" className="font-normal">
                        {employee.role}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="font-normal text-muted-foreground">
                        No role set
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-3 py-2 sm:px-4 sm:py-3">
              <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                <DetailRow icon={UserRound} label="Full name">
                  <span className="font-medium">{employee.name}</span>
                </DetailRow>
                <Separator />
                <DetailRow icon={Briefcase} label="Role">
                  {employee.role ? (
                    <span>{employee.role}</span>
                  ) : (
                    <span className="text-muted-foreground">Not specified</span>
                  )}
                </DetailRow>
                <Separator />
                <DetailRow icon={MapPin} label="Address">
                  {employee.address ? (
                    <p className="leading-relaxed text-muted-foreground">
                      {employee.address}
                    </p>
                  ) : (
                    <span className="text-muted-foreground">Not specified</span>
                  )}
                </DetailRow>
              </div>
            </div>

            <DialogFooter className="border-t bg-muted/40 px-6 py-4 sm:justify-end">
              <Button
                type="button"
                variant="default"
                className="min-w-[7rem]"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
