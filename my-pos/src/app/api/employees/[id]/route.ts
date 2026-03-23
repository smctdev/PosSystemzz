/**
 * GET /api/employees/[id]
 * PUT /api/employees/[id] — body: { name, role?, address? }
 * DELETE /api/employees/[id]
 */

import { NextResponse } from "next/server";
import { employees } from "../../data/employees";
import { EMPLOYEE_ADDRESS_OPTIONS } from "@/lib/employee-address-options";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (!Number.isFinite(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid id" },
        { status: 400 }
      );
    }
    const employee = employees.find((e) => e.id === id);
    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, employee });
  } catch (error) {
    console.error("Get employee error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch employee" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (!Number.isFinite(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid id" },
        { status: 400 }
      );
    }
    const index = employees.findIndex((e) => e.id === id);
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const roleRaw = body.role;
    const role =
      typeof roleRaw === "string" && roleRaw.trim()
        ? roleRaw.trim()
        : undefined;
    const addressRaw = body.address;
    const address =
      typeof addressRaw === "string" && addressRaw.trim()
        ? addressRaw.trim()
        : undefined;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }
    if (!address) {
      return NextResponse.json(
        { success: false, error: "Address is required" },
        { status: 400 }
      );
    }
    if (!EMPLOYEE_ADDRESS_OPTIONS.includes(address)) {
      return NextResponse.json(
        { success: false, error: "Invalid address selection" },
        { status: 400 }
      );
    }

    employees[index] = { ...employees[index], name, role, address };

    return NextResponse.json({
      success: true,
      employee: employees[index],
      message: "Employee updated successfully",
    });
  } catch (error) {
    console.error("Update employee error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update employee" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (!Number.isFinite(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid id" },
        { status: 400 }
      );
    }
    const index = employees.findIndex((e) => e.id === id);
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 }
      );
    }
    employees.splice(index, 1);
    return NextResponse.json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    console.error("Delete employee error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete employee" },
      { status: 500 }
    );
  }
}
