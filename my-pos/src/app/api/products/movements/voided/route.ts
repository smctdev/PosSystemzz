/**
 * GET /api/products/movements/voided — list voided product-out records (audit)
 */

import { NextResponse } from "next/server";
import { voidedProductOuts } from "../../../data/movements";

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      voidedOuts: voidedProductOuts,
    });
  } catch (error) {
    console.error("Get voided movements error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch voided movements" },
      { status: 500 }
    );
  }
}
