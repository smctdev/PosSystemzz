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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { EmployeeCombobox } from "@/components/employee-combobox";
import { apiService } from "@/lib/api/apiService";
import type { Employee, Product } from "@/lib/api/types";

export interface ProductOutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  /** Called after a successful record; use to refetch lists */
  onSuccess?: () => void | Promise<void>;
  /** When the dialog opens, pre-select this product (e.g. from a table row) */
  initialProductId?: number;
}

export function ProductOutModal({
  open,
  onOpenChange,
  products,
  onSuccess,
  initialProductId,
}: ProductOutModalProps) {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const availableProducts = products.filter((p) => p.stock > 0);
  const selected = products.find((p) => p.id === parseInt(productId, 10));
  const maxQty = selected?.stock ?? 0;

  const resetForm = () => {
    setProductId("");
    setQuantity("1");
    setReason("");
    setEmployeeId("");
    setFormError(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    onOpenChange(next);
  };

  useEffect(() => {
    if (!open) return;
    setFormError(null);
  }, [open]);

  useEffect(() => {
    if (!open || !initialProductId) return;
    const p = products.find(
      (x) => x.id === initialProductId && x.stock > 0
    );
    if (p) setProductId(String(p.id));
  }, [open, initialProductId, products]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setEmployeesLoading(true);
      try {
        const res = await apiService.employees.getAll();
        if (!cancelled && res.success) {
          setEmployees(res.employees);
        }
      } finally {
        if (!cancelled) setEmployeesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const id = parseInt(productId, 10);
    const qty = parseInt(quantity, 10);
    if (!id || !availableProducts.some((p) => p.id === id)) {
      setFormError("Select a product with available stock.");
      return;
    }
    if (!Number.isFinite(qty) || qty < 1) {
      setFormError("Enter a valid quantity.");
      return;
    }
    const stock = products.find((p) => p.id === id)?.stock ?? 0;
    if (qty > stock) {
      setFormError("Quantity cannot exceed current stock.");
      return;
    }
    if (!reason.trim()) {
      setFormError("Reason is required.");
      return;
    }
    const empId = parseInt(employeeId, 10);
    if (!empId || !employees.some((e) => e.id === empId)) {
      setFormError("Select the employee who recorded this.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiService.products.recordProductOut({
        productId: id,
        quantity: qty,
        reason: reason.trim(),
        employeeId: empId,
      });
      if (!result.success) {
        setFormError(result.error || "Could not record product out.");
        return;
      }
      await onSuccess?.();
      handleOpenChange(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Product out</DialogTitle>
          <DialogDescription>
            Remove stock for waste, transfer, samples, or other non-sale
            reasons. Sales should use the cashier flow.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-2">
            {formError && (
              <p className="text-sm text-destructive" role="alert">
                {formError}
              </p>
            )}
            <div className="grid gap-2">
              <Label htmlFor="product-out-product">Product</Label>
              <Select
                value={productId || undefined}
                onValueChange={setProductId}
                disabled={availableProducts.length === 0 || submitting}
              >
                <SelectTrigger id="product-out-product" className="w-full">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} ({p.stock} in stock
                      {p.sku ? ` · ${p.sku}` : ""})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableProducts.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No products with stock available.
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-out-qty">Quantity</Label>
              <Input
                id="product-out-qty"
                type="number"
                min={1}
                max={maxQty || undefined}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={!productId || submitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-out-reason">Reason</Label>
              <Input
                id="product-out-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Damaged, expired, staff meal"
                disabled={submitting}
                required
              />
            </div>
            <EmployeeCombobox
              id="product-out-employee"
              employees={employees}
              value={employeeId}
              onValueChange={setEmployeeId}
              loading={employeesLoading}
              disabled={submitting}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                submitting ||
                availableProducts.length === 0 ||
                !productId ||
                !employeeId ||
                employeesLoading
              }
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner size="sm" />
                  Saving…
                </span>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
