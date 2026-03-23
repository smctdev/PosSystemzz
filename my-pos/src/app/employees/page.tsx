"use client";

import { useState, useEffect, useMemo } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Search, Users, Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiService } from "@/lib/api/apiService";
import type { Employee } from "@/lib/api/types";
import { ErrorDisplay } from "@/components/error-display";
import {
  AddEmployeeModal,
  EditEmployeeModal,
  ViewEmployeeModal,
  DeleteEmployeeModal,
} from "@/components/employees";

export default function EmployeesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiService.employees.getAll();
      if (res.success) {
        setEmployees(res.employees);
      } else {
        setError(res.error || "Failed to load employees");
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load employees."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const refreshEmployees = async () => {
    const res = await apiService.employees.getAll();
    if (res.success) {
      setEmployees(res.employees);
    }
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(q) ||
        (emp.role && emp.role.toLowerCase().includes(q)) ||
        (emp.address && emp.address.toLowerCase().includes(q)) ||
        String(emp.id).includes(q)
    );
  }, [employees, searchQuery]);

  if (isLoading) {
    return (
      <DashboardShell
        title="Employees"
        description="Staff directory used for product-out and reporting"
        headerAction={
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add employee
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 flex-1 max-w-xs" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 flex-1 max-w-sm" />
                <Skeleton className="h-9 w-28 shrink-0" />
              </div>
            ))}
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Employees"
      description="Staff directory used for product-out and reporting"
      headerAction={
        <div className="flex flex-wrap items-center gap-2">
          <AddEmployeeModal
            open={isAddEmployeeOpen}
            onOpenChange={setIsAddEmployeeOpen}
            onSuccess={refreshEmployees}
          />
          <Button onClick={() => setIsAddEmployeeOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add employee
          </Button>
        </div>
      }
    >
      {error && (
        <ErrorDisplay error={error} onRetry={fetchEmployees} />
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cashiers</CardTitle>
            <Badge variant="secondary" className="font-normal">
              role
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employees.filter((e) => e.role?.toLowerCase() === "cashier").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">With cashier role</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Other roles</CardTitle>
            <Badge variant="outline" className="font-normal">
              kitchen / admin
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employees.filter((e) => e.role?.toLowerCase() !== "cashier").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Non-cashier</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Directory</CardTitle>
              <CardDescription>
                Search by name, role, or ID.
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search employees…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {emp.id}
                    </TableCell>
                    <TableCell className="font-medium">{emp.name}</TableCell>
                    <TableCell>
                      {emp.role ? (
                        <Badge variant="outline">{emp.role}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs text-muted-foreground text-sm align-top">
                      {emp.address ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="View"
                          aria-label={`View ${emp.name}`}
                          onClick={() => setViewEmployee(emp)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Edit"
                          aria-label={`Edit ${emp.name}`}
                          onClick={() => setEditEmployee(emp)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Delete"
                          aria-label={`Delete ${emp.name}`}
                          onClick={() => setDeleteEmployee(emp)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-10"
                  >
                    No employees match your search
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ViewEmployeeModal
        open={viewEmployee !== null}
        onOpenChange={(o) => {
          if (!o) setViewEmployee(null);
        }}
        employee={viewEmployee}
      />
      <EditEmployeeModal
        open={editEmployee !== null}
        onOpenChange={(o) => {
          if (!o) setEditEmployee(null);
        }}
        employee={editEmployee}
        onSuccess={refreshEmployees}
      />
      <DeleteEmployeeModal
        open={deleteEmployee !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteEmployee(null);
        }}
        employee={deleteEmployee}
        onSuccess={refreshEmployees}
      />
    </DashboardShell>
  );
}
