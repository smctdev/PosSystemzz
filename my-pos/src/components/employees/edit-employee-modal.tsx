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
import { DEMO_ADMIN_PASSWORD } from "@/lib/admin-demo-password";
import { apiService } from "@/lib/api/apiService";
import type { Employee } from "@/lib/api/types";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const ROLE_CUSTOM = "__custom__";
const ROLE_PRESETS: readonly string[] = ["Cashier", "Kitchen", "Admin"];
const EDIT_EMPLOYEE_SUBMIT_DELAY_MS = 2000;
const EDIT_EMPLOYEE_CONTINUE_DELAY_MS = 2000;

function roleToForm(role?: string): { preset: string; custom: string } {
  if (role && ROLE_PRESETS.includes(role)) {
    return { preset: role, custom: "" };
  }
  return { preset: ROLE_CUSTOM, custom: role ?? "" };
}

export interface EditEmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onSuccess?: () => void | Promise<void>;
}

export function EditEmployeeModal({
  open,
  onOpenChange,
  employee,
  onSuccess,
}: EditEmployeeModalProps) {
  const [step, setStep] = useState<"form" | "verify">("form");
  const [name, setName] = useState("");
  const [rolePreset, setRolePreset] = useState<string>("Cashier");
  const [roleCustom, setRoleCustom] = useState("");
  const [address, setAddress] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [continueLoading, setContinueLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const saveInFlightRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setStep("form");
      setAdminPassword("");
      setContinueLoading(false);
      saveInFlightRef.current = false;
      return;
    }
    if (!employee) return;
    setName(employee.name);
    const { preset, custom } = roleToForm(employee.role);
    setRolePreset(preset);
    setRoleCustom(custom);
    setAddress(employee.address ?? "");
    setFormError(null);
    setStep("form");
    setAdminPassword("");
    setContinueLoading(false);
  }, [open, employee]);

  const resetForm = () => {
    setFormError(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setStep("form");
      setAdminPassword("");
      setContinueLoading(false);
      resetForm();
    }
    onOpenChange(next);
  };

  const resolveRole = (): string | undefined => {
    if (rolePreset === ROLE_CUSTOM) {
      const t = roleCustom.trim();
      return t || undefined;
    }
    return rolePreset;
  };

  const handleFormContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee || continueLoading) return;
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

    setContinueLoading(true);
    try {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
      await new Promise<void>((resolve) =>
        setTimeout(resolve, EDIT_EMPLOYEE_CONTINUE_DELAY_MS)
      );
      setAdminPassword("");
      setStep("verify");
    } finally {
      setContinueLoading(false);
    }
  };

  const performUpdate = async () => {
    if (!employee) return;
    if (saveInFlightRef.current) return;
    saveInFlightRef.current = true;
    const trimmed = name.trim();
    setSubmitting(true);
    setFormError(null);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
    await new Promise<void>((resolve) =>
      setTimeout(resolve, EDIT_EMPLOYEE_SUBMIT_DELAY_MS)
    );
    try {
      const result = await apiService.employees.update({
        id: employee.id,
        name: trimmed,
        role: resolveRole(),
        address: address.trim(),
      });
      if (!result.success) {
        setFormError(result.error || "Could not update employee.");
        return;
      }
      await onSuccess?.();
      toast.success("Employee updated", {
        description: `Changes for ${trimmed} were saved successfully.`,
      });
      handleOpenChange(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
      saveInFlightRef.current = false;
    }
  };

  const handleVerifyAndSave = async () => {
    if (adminPassword !== DEMO_ADMIN_PASSWORD) {
      const message =
        "The admin password does not match. Try again or go back to edit the form.";
      setFormError(message);
      toast.error("Incorrect password", {
        description: message,
      });
      return;
    }
    await performUpdate();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {employee ? (
          step === "form" ? (
            <>
              <DialogHeader>
                <DialogTitle>Edit employee</DialogTitle>
                <DialogDescription>
                  Update details for {employee.name}. You will confirm with an
                  admin password before changes are saved.
                </DialogDescription>
              </DialogHeader>
              <div className="relative">
                {continueLoading && (
                  <div
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg bg-background/75 backdrop-blur-[1px]"
                    aria-busy="true"
                    aria-live="polite"
                  >
                    <Spinner size="lg" className="text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Preparing verification…
                    </p>
                  </div>
                )}
                <form onSubmit={(e) => void handleFormContinue(e)}>
                  <div className="grid gap-4 py-2">
                  {formError && (
                    <p className="text-sm text-destructive" role="alert">
                      {formError}
                    </p>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="edit-emp-name">Full name</Label>
                    <Input
                      id="edit-emp-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={submitting || continueLoading}
                      required
                      autoComplete="name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-emp-role-preset">Role</Label>
                    <Select
                      value={rolePreset}
                      onValueChange={setRolePreset}
                      disabled={submitting || continueLoading}
                    >
                      <SelectTrigger id="edit-emp-role-preset" className="w-full">
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
                        id="edit-emp-role-custom"
                        value={roleCustom}
                        onChange={(e) => setRoleCustom(e.target.value)}
                        placeholder="Type role"
                        disabled={submitting || continueLoading}
                      />
                    )}
                  </div>
                  <AddressCombobox
                    id="edit-emp-address"
                    options={EMPLOYEE_ADDRESS_OPTIONS}
                    value={address}
                    onValueChange={setAddress}
                    disabled={submitting || continueLoading}
                    label="Address"
                    placeholder="Search address…"
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    disabled={submitting || continueLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || continueLoading || !address.trim()}
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
              </form>
              </div>
            </>
          ) : (
            <div className="relative">
              {submitting && (
                <div
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg bg-background/75 backdrop-blur-[1px]"
                  aria-busy="true"
                  aria-live="polite"
                >
                  <Spinner size="lg" className="text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Saving changes…
                  </p>
                </div>
              )}
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                    <ShieldCheck className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <DialogTitle>Admin verification</DialogTitle>
                    <DialogDescription className="mt-1">
                      Enter the admin password to save changes for{" "}
                      <span className="font-medium text-foreground">
                        {employee.name}
                      </span>
                      .
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                {formError && (
                  <p className="text-sm text-destructive" role="alert">
                    {formError}
                  </p>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="edit-emp-admin-password">Admin password</Label>
                  <Input
                    id="edit-emp-admin-password"
                    type="password"
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      setFormError(null);
                    }}
                    placeholder="Enter admin password"
                    autoComplete="off"
                    disabled={submitting}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !submitting && adminPassword) {
                        e.preventDefault();
                        void handleVerifyAndSave();
                      }
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep("form");
                    setAdminPassword("");
                    setFormError(null);
                  }}
                  disabled={submitting}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={async () => {
                    await handleVerifyAndSave();
                  }}
                  disabled={submitting || !adminPassword}
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner size="sm" />
                      Saving…
                    </span>
                  ) : (
                    "Save changes"
                  )}
                </Button>
              </DialogFooter>
            </div>
          )
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
