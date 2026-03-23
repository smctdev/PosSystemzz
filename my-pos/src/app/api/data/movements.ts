/**
 * 📊 SHARED PRODUCT MOVEMENTS DATA STORE
 * 
 * This file contains the shared in-memory product movements data.
 * 
 * TODO: Replace with database in production
 */

export interface ProductMovement {
  id: number;
  productId: number;
  product: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  date: string;
  time: string;
  /** Present on stock-out rows when recorded from the product-out flow */
  employeeId?: number;
  employeeName?: string;
}

/** Snapshot of a product-out row when it is voided (audit trail). */
export interface VoidedProductOut {
  id: number;
  originalMovementId: number;
  productId: number;
  product: string;
  quantity: number;
  reason: string;
  employeeName?: string;
  recordedDate: string;
  recordedTime: string;
  voidedAtDate: string;
  voidedAtTime: string;
}

// Shared movements array
export let movements: ProductMovement[] = [];

// Voided product-out log (newest first)
export let voidedProductOuts: VoidedProductOut[] = [];

