"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { DEMO_ADMIN_PASSWORD } from "@/lib/admin-demo-password";
import { apiService } from "@/lib/api/apiService";
import type { ProductMovement } from "@/lib/api/types";
import { Ban, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const VOID_PRODUCT_OUT_LOADING_MIN_MS = 2000;

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export interface VoidProductOutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movement: ProductMovement | null;
  onSuccess?: () => void | Promise<void>;
}

export function VoidProductOutModal({
  open,
  onOpenChange,
  movement,
  onSuccess,
}: VoidProductOutModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setPassword("");
      setError(null);
      return;
    }
    setPassword("");
    setError(null);
  }, [open, movement?.id]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setPassword("");
      setError(null);
    }
    onOpenChange(next);
  };

  const handleVoid = async () => {
    if (!movement) return;
    if (password !== DEMO_ADMIN_PASSWORD) {
      const message =
        "The admin password does not match. Try again or cancel.";
      setError(message);
      toast.error("Incorrect password", { description: message });
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const startedAt = Date.now();
      const result = await apiService.products.voidProductOut(movement.id);
      if (!result.success) {
        setError(result.error || "Could not void this movement.");
        return;
      }
      // Keep the spinner visible for a consistent minimum time.
      const elapsed = Date.now() - startedAt;
      await delay(Math.max(0, VOID_PRODUCT_OUT_LOADING_MIN_MS - elapsed));

      await onSuccess?.();
      toast.success("Product out voided", {
        description: `${movement.quantity} unit(s) restored for ${movement.product}.`,
      });
      handleOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={!submitting}
        onPointerDownOutside={(e) => {
          if (submitting) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (submitting) e.preventDefault();
        }}
      >
        {movement ? (
          submitting ? (
            <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
              <div
                className="flex size-11 items-center justify-center rounded-full bg-primary/10"
                aria-hidden
              >
                <Spinner size="lg" className="text-primary" />
              </div>
              <div className="space-y-1">
                <DialogHeader className="space-y-1 text-center sm:text-center">
                  <DialogTitle className="text-base font-semibold">
                    Voiding product out
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Restoring inventory and updating records…
                  </DialogDescription>
                </DialogHeader>
              </div>
            </div>
          ) : (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive"
                    aria-hidden
                  >
                    <Ban className="size-5" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <DialogTitle>Void product out</DialogTitle>
                    <DialogDescription className="text-pretty">
                      This removes the out record and restores{" "}
                      <span className="font-medium text-foreground">
                        {movement.quantity}
                      </span>{" "}
                      unit(s) to stock for{" "}
                      <span className="font-medium text-foreground">
                        {movement.product}
                      </span>
                      . Enter the admin password to confirm.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                <ShieldCheck className="size-4 shrink-0 text-muted-foreground" />
                <span>
                  Reason on file:{" "}
                  <span className="text-foreground">{movement.reason}</span>
                  {movement.employeeName ? (
                    <>
                      {" "}
                      · Recorded by {movement.employeeName}
                    </>
                  ) : null}
                </span>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="void-product-out-password">
                  Admin password
                </Label>
                <Input
                  id="void-product-out-password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter admin password"
                  autoComplete="off"
                  disabled={submitting}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !submitting && password) {
                      e.preventDefault();
                      void handleVoid();
                    }
                  }}
                />
                {error ? (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                ) : null}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => void handleVoid()}
                  disabled={submitting || !password}
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner size="sm" />
                      Voiding…
                    </span>
                  ) : (
                    "Void product out"
                  )}
                </Button>
              </DialogFooter>
            </>
          )
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
