"use client";

import { useEffect, useRef, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { apiService } from "@/lib/api/apiService";
import { DEMO_ADMIN_PASSWORD } from "@/lib/admin-demo-password";
import type { Employee } from "@/lib/api/types";
import {
  AlertTriangle,
  Briefcase,
  Info,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DELETE_EMPLOYEE_SUBMIT_DELAY_MS = 2000;
const DELETE_EMPLOYEE_CONTINUE_DELAY_MS = 2000;

export interface DeleteEmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onSuccess?: () => void | Promise<void>;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

export function DeleteEmployeeModal({
  open,
  onOpenChange,
  employee,
  onSuccess,
}: DeleteEmployeeModalProps) {
  const [step, setStep] = useState<"confirm" | "verify">("confirm");
  const [adminPassword, setAdminPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [continueLoading, setContinueLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deleteInFlightRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setStep("confirm");
      setAdminPassword("");
      setError(null);
      setContinueLoading(false);
      deleteInFlightRef.current = false;
      return;
    }
    if (!employee) return;
    setStep("confirm");
    setAdminPassword("");
    setError(null);
    setContinueLoading(false);
  }, [open, employee]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setStep("confirm");
      setAdminPassword("");
      setError(null);
      setContinueLoading(false);
    }
    onOpenChange(next);
  };

  const handleContinueToVerify = async () => {
    setContinueLoading(true);
    try {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
      await new Promise<void>((resolve) =>
        setTimeout(resolve, DELETE_EMPLOYEE_CONTINUE_DELAY_MS)
      );
      setAdminPassword("");
      setError(null);
      setStep("verify");
    } finally {
      setContinueLoading(false);
    }
  };

  const performDelete = async () => {
    if (!employee) return;
    if (deleteInFlightRef.current) return;
    deleteInFlightRef.current = true;
    const removedName = employee.name;
    setSubmitting(true);
    setError(null);
    try {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
      await new Promise<void>((resolve) =>
        setTimeout(resolve, DELETE_EMPLOYEE_SUBMIT_DELAY_MS)
      );
      const result = await apiService.employees.delete(employee.id);
      if (!result.success) {
        setError(result.error || "Could not delete employee.");
        return;
      }
      await onSuccess?.();
      toast.success("Employee removed", {
        description: `${removedName} was removed from the directory.`,
      });
      handleOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
      deleteInFlightRef.current = false;
    }
  };

  const handleVerifyAndRemove = async () => {
    if (adminPassword !== DEMO_ADMIN_PASSWORD) {
      const message =
        "The admin password does not match. Try again or go back to review.";
      setError(message);
      toast.error("Incorrect password", {
        description: message,
      });
      return;
    }
    await performDelete();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton
        className="gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        {employee ? (
          step === "confirm" ? (
            <>
              <div
                className={cn(
                  "relative border-b bg-gradient-to-br from-destructive/14 via-destructive/6 to-transparent",
                  "px-6 pb-6 pt-8 pr-14 sm:pr-16"
                )}
              >
                <DialogHeader className="space-y-4 text-left">
                  <div className="flex gap-4">
                    <div
                      className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-destructive/15 text-destructive shadow-sm ring-1 ring-destructive/15"
                      aria-hidden
                    >
                      <AlertTriangle className="size-6" strokeWidth={2} />
                    </div>
                    <div className="min-w-0 space-y-1.5 pt-0.5">
                      <DialogTitle className="text-xl font-semibold tracking-tight">
                        Remove employee
                      </DialogTitle>
                      <DialogDescription className="text-pretty text-sm leading-relaxed">
                        This person will be removed from the staff directory.
                        Existing product-out records that reference them stay as
                        they are.
                      </DialogDescription>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 rounded-xl border border-border/80 bg-card p-4 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
                    <Avatar className="size-14 border-2 border-background shadow-md ring-1 ring-border/50">
                      <AvatarFallback className="bg-primary/10 text-base font-semibold text-primary">
                        {initialsFromName(employee.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="truncate text-base font-semibold text-foreground">
                        {employee.name}
                      </p>
                      <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                        {employee.role ? (
                          <span className="flex items-center gap-2">
                            <Briefcase
                              className="size-3.5 shrink-0 opacity-70"
                              aria-hidden
                            />
                            <Badge variant="secondary" className="font-normal">
                              {employee.role}
                            </Badge>
                          </span>
                        ) : null}
                        {employee.address ? (
                          <span className="flex items-start gap-2">
                            <MapPin
                              className="mt-0.5 size-3.5 shrink-0 opacity-70"
                              aria-hidden
                            />
                            <span className="leading-snug">
                              {employee.address}
                            </span>
                          </span>
                        ) : null}
                        {!employee.role && !employee.address ? (
                          <span className="text-xs italic opacity-80">
                            No role or address on file
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </DialogHeader>
              </div>

              <div className="px-6 py-5">
                <div className="flex gap-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/[0.09]">
                  <Info
                    className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-500/90"
                    aria-hidden
                  />
                  <p className="text-left text-xs leading-relaxed text-amber-950/90 dark:text-amber-100/85">
                    This cannot be undone from this screen. Confirm you chose
                    the right person—you will enter an{" "}
                    <span className="font-medium">admin password</span> on the
                    next step.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="relative bg-muted/30 px-6 py-4">
                {continueLoading && (
                  <div
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg bg-background/75 backdrop-blur-[1px]"
                    aria-busy="true"
                    aria-live="polite"
                  >
                    <Spinner size="lg" className="text-destructive" />
                    <p className="text-sm text-muted-foreground">
                      Preparing verification…
                    </p>
                  </div>
                )}
                <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => handleOpenChange(false)}
                    disabled={continueLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full sm:w-auto"
                    onClick={() => void handleContinueToVerify()}
                    disabled={continueLoading}
                  >
                    {continueLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <Spinner size="sm" />
                        Please wait…
                      </span>
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </DialogFooter>
              </div>
            </>
          ) : (
            <>
              <div
                className={cn(
                  "relative border-b bg-gradient-to-br from-primary/12 via-primary/5 to-transparent",
                  "px-6 pb-5 pt-8 pr-14 sm:pr-16"
                )}
              >
                <DialogHeader className="space-y-0 text-left">
                  <div className="flex gap-4">
                    <div
                      className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary shadow-sm ring-1 ring-primary/15"
                      aria-hidden
                    >
                      <ShieldCheck className="size-6" strokeWidth={2} />
                    </div>
                    <div className="min-w-0 space-y-2 pt-0.5">
                      <DialogTitle className="text-xl font-semibold tracking-tight">
                        Admin verification
                      </DialogTitle>
                      <DialogDescription className="text-pretty text-sm leading-relaxed">
                        Enter the admin password to permanently remove{" "}
                        <span className="font-medium text-foreground">
                          {employee.name}
                        </span>{" "}
                        from the directory.
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
              </div>

              <div className="relative px-6 py-5">
                {submitting && (
                  <div
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg bg-background/80 backdrop-blur-sm"
                    aria-busy="true"
                    aria-live="polite"
                  >
                    <Spinner size="lg" className="text-destructive" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Removing…
                    </p>
                  </div>
                )}

                <div className="mb-4 flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2.5 text-sm">
                  <Avatar className="size-9 border border-border/60">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {initialsFromName(employee.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {employee.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Removal pending password
                    </p>
                  </div>
                </div>

                <div className="grid gap-4">
                  {error ? (
                    <p
                      className="rounded-lg border border-destructive/35 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
                      role="alert"
                    >
                      {error}
                    </p>
                  ) : null}
                  <div className="grid gap-2">
                    <Label htmlFor="delete-emp-admin-password">
                      Admin password
                    </Label>
                    <Input
                      id="delete-emp-admin-password"
                      type="password"
                      value={adminPassword}
                      onChange={(e) => {
                        setAdminPassword(e.target.value);
                        setError(null);
                      }}
                      placeholder="Enter admin password"
                      autoComplete="off"
                      disabled={submitting}
                      className="h-10"
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          !submitting &&
                          adminPassword
                        ) {
                          e.preventDefault();
                          void handleVerifyAndRemove();
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="bg-muted/30 px-6 py-4">
                <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => {
                      setStep("confirm");
                      setAdminPassword("");
                      setError(null);
                    }}
                    disabled={submitting}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full sm:w-auto"
                    onClick={() => void handleVerifyAndRemove()}
                    disabled={submitting || !adminPassword}
                  >
                    {submitting ? (
                      <span className="inline-flex items-center gap-2">
                        <Spinner size="sm" />
                        Removing…
                      </span>
                    ) : (
                      "Remove employee"
                    )}
                  </Button>
                </DialogFooter>
              </div>
            </>
          )
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
