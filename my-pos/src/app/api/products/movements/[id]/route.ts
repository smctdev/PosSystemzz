/**
 * DELETE /api/products/movements/[id] — void a product-out movement (restores stock, removes row)
 */

import { NextResponse } from "next/server";
import { movements, voidedProductOuts } from "../../../data/movements";
import { products } from "../../../data/products";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (!Number.isFinite(id) || id < 1) {
      return NextResponse.json(
        { success: false, error: "Invalid movement id" },
        { status: 400 }
      );
    }

    const index = movements.findIndex((m) => m.id === id);
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "Movement not found" },
        { status: 404 }
      );
    }

    const movement = movements[index];
    if (movement.type !== "out") {
      return NextResponse.json(
        {
          success: false,
          error: "Only product-out movements can be voided",
        },
        { status: 400 }
      );
    }

    const productId = movement.productId;
    const pIndex = products.findIndex((p) => p.id === productId);
    if (pIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Product not found for this movement" },
        { status: 404 }
      );
    }

    products[pIndex] = {
      ...products[pIndex],
      stock: products[pIndex].stock + movement.quantity,
    };

    const now = new Date();
    const voidLogId =
      voidedProductOuts.length > 0
        ? Math.max(...voidedProductOuts.map((v) => v.id)) + 1
        : 1;
    voidedProductOuts.unshift({
      id: voidLogId,
      originalMovementId: movement.id,
      productId: movement.productId,
      product: movement.product,
      quantity: movement.quantity,
      reason: movement.reason,
      employeeName: movement.employeeName,
      recordedDate: movement.date,
      recordedTime: movement.time,
      voidedAtDate: now.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      voidedAtTime: now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    });

    movements.splice(index, 1);

    return NextResponse.json({
      success: true,
      message: "Product out voided; stock restored.",
      product: products[pIndex],
    });
  } catch (error) {
    console.error("Void movement error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to void movement" },
      { status: 500 }
    );
  }
}
