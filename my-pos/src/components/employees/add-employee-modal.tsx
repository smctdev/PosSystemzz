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
import { AddressCombobox } from "@/components/address-combobox";
import { EMPLOYEE_ADDRESS_OPTIONS } from "@/lib/employee-address-options";
import { apiService } from "@/lib/api/apiService";
import { toast } from "sonner";

export interface AddEmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void | Promise<void>;
}

const ROLE_CUSTOM = "__custom__";
const ADD_EMPLOYEE_SUBMIT_DELAY_MS = 2000;

export function AddEmployeeModal({
  open,
  onOpenChange,
  onSuccess,
}: AddEmployeeModalProps) {
  const [name, setName] = useState("");
  const [rolePreset, setRolePreset] = useState<string>("Cashier");
  const [roleCustom, setRoleCustom] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setRolePreset("Cashier");
    setRoleCustom("");
    setAddress("");
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

  const resolveRole = (): string | undefined => {
    if (rolePreset === ROLE_CUSTOM) {
      const t = roleCustom.trim();
      return t || undefined;
    }
    return rolePreset;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError("Name is required.");
      return;
    }
    if (rolePreset === ROLE_CUSTOM && !roleCustom.trim()) {
      setFormError("Enter a role or pick a preset.");
      return;
    }
    if (!address.trim()) {
      setFormError("Select an address from the list.");
      return;
    }

    setSubmitting(true);
    try {
      await new Promise<void>((resolve) =>
        setTimeout(resolve, ADD_EMPLOYEE_SUBMIT_DELAY_MS)
      );
      const result = await apiService.employees.create({
        name: trimmed,
        role: resolveRole(),
        address: address.trim(),
      });
      if (!result.success) {
        setFormError(result.error || "Could not add employee.");
        return;
      }
      await onSuccess?.();
      toast.success("Employee added", {
        description: `${trimmed} was added successfully.`,
      });
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
          <DialogTitle>Add employee</DialogTitle>
          <DialogDescription>
            New staff appear in the directory and in the product-out combobox.
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
              <Label htmlFor="add-emp-name">Full name</Label>
              <Input
                id="add-emp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Juan Dela Cruz"
                disabled={submitting}
                required
                autoComplete="name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-emp-role-preset">Role</Label>
              <Select
                value={rolePreset}
                onValueChange={setRolePreset}
                disabled={submitting}
              >
                <SelectTrigger id="add-emp-role-preset" className="w-full">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cashier">Cashier</SelectItem>
                  <SelectItem value="Kitchen">Kitchen</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value={ROLE_CUSTOM}>Custom…</SelectItem>
                </SelectContent>
              </Select>
              {rolePreset === ROLE_CUSTOM && (
                <Input
                  id="add-emp-role-custom"
                  value={roleCustom}
                  onChange={(e) => setRoleCustom(e.target.value)}
                  placeholder="Type role"
                  disabled={submitting}
                />
              )}
            </div>
            <AddressCombobox
              id="add-emp-address"
              options={EMPLOYEE_ADDRESS_OPTIONS}
              value={address}
              onValueChange={setAddress}
              disabled={submitting}
              label="Address"
              placeholder="Search address…"
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
            <Button type="submit" disabled={submitting || !address.trim()}>
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner size="sm" />
                  Saving…
                </span>
              ) : (
                "Add employee"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
