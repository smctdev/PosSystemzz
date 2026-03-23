/**
 * 📊 PRODUCT MOVEMENTS API ENDPOINT
 *
 * GET /api/products/movements — list movements
 * POST /api/products/movements — record stock out (body: productId, quantity, reason, employeeId)
 */

import { NextResponse } from 'next/server';
import { movements } from '../../data/movements';
import { products } from '../../data/products';
import { employees } from '../../data/employees';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      movements: movements,
    });
  } catch (error) {
    console.error('Get movements error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch movements' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const productId = parseInt(String(body.productId), 10);
    const quantity = parseInt(String(body.quantity), 10);
    const reason = String(body.reason ?? '').trim();
    const employeeId = parseInt(String(body.employeeId), 10);

    if (!Number.isFinite(productId) || productId < 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid product' },
        { status: 400 }
      );
    }
    if (!Number.isFinite(quantity) || quantity < 1) {
      return NextResponse.json(
        { success: false, error: 'Quantity must be at least 1' },
        { status: 400 }
      );
    }
    if (!reason) {
      return NextResponse.json(
        { success: false, error: 'Reason is required' },
        { status: 400 }
      );
    }
    if (!Number.isFinite(employeeId) || employeeId < 1) {
      return NextResponse.json(
        { success: false, error: 'Employee is required' },
        { status: 400 }
      );
    }

    const employee = employees.find((e) => e.id === employeeId);
    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 400 }
      );
    }

    const index = products.findIndex((p) => p.id === productId);
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    if (products[index].stock < quantity) {
      return NextResponse.json(
        { success: false, error: 'Insufficient stock' },
        { status: 400 }
      );
    }

    const updatedStock = products[index].stock - quantity;
    products[index] = { ...products[index], stock: updatedStock };

    const now = new Date();
    const newId =
      movements.length > 0 ? Math.max(...movements.map((m) => m.id)) + 1 : 1;
    const movement = {
      id: newId,
      productId,
      product: products[index].name,
      type: 'out' as const,
      quantity,
      reason,
      employeeId: employee.id,
      employeeName: employee.name,
      date: now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      time: now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };
    movements.unshift(movement);

    return NextResponse.json({
      success: true,
      movement,
      product: products[index],
    });
  } catch (error) {
    console.error('Record product out error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record product out' },
      { status: 500 }
    );
  }
}

