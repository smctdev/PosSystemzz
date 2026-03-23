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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiService } from "@/lib/api/apiService";
import type { VoidedProductOut } from "@/lib/api/types";
import { History, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VoidedProductOutsHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VoidedProductOutsHistoryModal({
  open,
  onOpenChange,
}: VoidedProductOutsHistoryModalProps) {
  const [rows, setRows] = useState<VoidedProductOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await apiService.products.getVoidedProductOuts();
        if (cancelled) return;
        if (res.success) {
          setRows(res.voidedOuts);
        } else {
          setFetchError(res.error || "Could not load void history.");
          setRows([]);
        }
      } catch (e) {
        if (!cancelled) {
          setFetchError(
            e instanceof Error ? e.message : "Could not load void history."
          );
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex max-h-[min(90vh,760px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
      >
        <div
          className={cn(
            "shrink-0 border-b bg-gradient-to-br from-primary/12 via-primary/5 to-transparent",
            "px-6 py-6 pr-12 sm:pr-14"
          )}
        >
          <DialogHeader className="space-y-0 text-left">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="flex gap-4">
                <div
                  className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary shadow-sm ring-1 ring-primary/15"
                  aria-hidden
                >
                  <History className="size-6" strokeWidth={2} />
                </div>
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <DialogTitle className="text-xl font-semibold tracking-tight">
                      Voided product outs
                    </DialogTitle>
                    {!loading && !fetchError && rows.length > 0 ? (
                      <Badge variant="secondary" className="font-normal">
                        {rows.length}{" "}
                        {rows.length === 1 ? "record" : "records"}
                      </Badge>
                    ) : null}
                  </div>
                  <DialogDescription className="text-pretty text-sm leading-relaxed">
                    Audit log of stock-out entries that were voided. Inventory
                    was increased again when each row was removed.
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="space-y-3 rounded-xl border border-dashed border-muted-foreground/25 bg-muted/20 p-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : fetchError ? (
            <div
              className="rounded-xl border border-destructive/35 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {fetchError}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/15 px-6 py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-muted/80">
                <ScrollText
                  className="size-7 text-muted-foreground/50"
                  strokeWidth={1.5}
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  No voided outs yet
                </p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  When you void a product out from the movements table on the
                  Products page, it will show up here for your records.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
              <Table>
                <TableHeader>
                  <TableRow className="border-b bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold">Voided at</TableHead>
                    <TableHead className="font-semibold">Product</TableHead>
                    <TableHead className="text-right font-semibold">Qty</TableHead>
                    <TableHead className="font-semibold">Reason</TableHead>
                    <TableHead className="font-semibold">Recorded by</TableHead>
                    <TableHead className="font-semibold">Original out</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} className="border-border/60">
                      <TableCell className="align-top">
                        <div className="font-medium">{row.voidedAtDate}</div>
                        <div className="text-xs tabular-nums text-muted-foreground">
                          {row.voidedAtTime}
                        </div>
                      </TableCell>
                      <TableCell className="align-top font-medium">
                        {row.product}
                      </TableCell>
                      <TableCell className="align-top text-right">
                        <Badge variant="secondary" className="tabular-nums">
                          {row.quantity}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[160px] align-top text-muted-foreground">
                        <span className="line-clamp-2 text-sm leading-snug">
                          {row.reason}
                        </span>
                      </TableCell>
                      <TableCell className="align-top text-muted-foreground">
                        {row.employeeName ?? "—"}
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="text-sm">{row.recordedDate}</div>
                        <div className="text-xs tabular-nums text-muted-foreground">
                          {row.recordedTime}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t bg-muted/30 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            className="min-w-[6rem]"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
