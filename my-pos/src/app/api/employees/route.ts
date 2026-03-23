/**
 * GET /api/employees — list staff
 * POST /api/employees — add staff (body: name, optional role, optional address)
 */

import { NextResponse } from "next/server";
import { employees } from "../data/employees";
import { EMPLOYEE_ADDRESS_OPTIONS } from "@/lib/employee-address-options";

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      employees,
    });
  } catch (error) {
    console.error("Get employees error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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

    const newId =
      employees.length > 0
        ? Math.max(...employees.map((e) => e.id)) + 1
        : 1;
    const employee = { id: newId, name, role, address };
    employees.push(employee);

    return NextResponse.json({
      success: true,
      employee,
      message: "Employee added successfully",
    });
  } catch (error) {
    console.error("Create employee error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add employee" },
      { status: 500 }
    );
  }
}
