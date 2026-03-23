/**
 * 📝 TYPE DEFINITIONS
 * 
 * All TypeScript types/interfaces for API requests and responses
 */

// User & Auth Types
export type UserRole = 'admin' | 'cashier' | 'kitchen';

export interface User {
  id: number;
  username: string;
  role: UserRole;
}

export interface LoginRequest {
  username: string;
  password: string;
  role: UserRole;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  error?: string;
  message?: string;
}

// Product Types
export interface Product {
  id: number;
  name: string;
  sku?: string;
  price: number;
  stock: number;
  category: string;
  image?: string;
}

export interface CreateProductRequest {
  name: string;
  sku?: string;
  price: number;
  stock: number;
  category: string;
  image?: string;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: number;
}

export interface ProductsResponse {
  success: boolean;
  products: Product[];
  error?: string;
}

export interface ProductResponse {
  success: boolean;
  product: Product;
  error?: string;
  message?: string;
}

// Transaction Types
export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface Transaction {
  id: string;
  receiptNumber: string;
  customerName: string;
  items: CartItem[];
  total: number;
  timestamp: number;
  time: string;
  date: string;
  userId?: number;
  kitchenStatus?: 'preparing' | 'completed'; // Kitchen order status
}

export interface CreateTransactionRequest {
  customerName: string;
  items: CartItem[];
  total: number;
}

export interface TransactionResponse {
  success: boolean;
  transaction?: Transaction;
  error?: string;
  message?: string;
}

export interface TransactionsResponse {
  success: boolean;
  transactions: Transaction[];
  error?: string;
}

// Employee (staff list for attributing stock moves, etc.)
export interface Employee {
  id: number;
  name: string;
  role?: string;
  address?: string;
}

export interface EmployeesResponse {
  success: boolean;
  employees: Employee[];
  error?: string;
}

export interface CreateEmployeeRequest {
  name: string;
  role?: string;
  address?: string;
}

export interface UpdateEmployeeRequest {
  id: number;
  name: string;
  role?: string;
  address?: string;
}

export interface EmployeeResponse {
  success: boolean;
  employee?: Employee;
  error?: string;
  message?: string;
}

export interface DeleteEmployeeResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Product Movement Types
export interface ProductMovement {
  id: number;
  date: string;
  time: string;
  product: string;
  productId?: number;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  employeeId?: number;
  employeeName?: string;
}

export interface ProductMovementsResponse {
  success: boolean;
  movements: ProductMovement[];
  error?: string;
}

export interface RecordProductOutRequest {
  productId: number;
  quantity: number;
  reason: string;
  employeeId: number;
}

export interface RecordProductOutResponse {
  success: boolean;
  movement?: ProductMovement;
  product?: Product;
  error?: string;
}

export interface VoidProductOutResponse {
  success: boolean;
  message?: string;
  product?: Product;
  error?: string;
}

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

export interface VoidedProductOutsResponse {
  success: boolean;
  voidedOuts: VoidedProductOut[];
  error?: string;
}

// Dashboard Stats Types
export interface DashboardStats {
  today: {
    amount: number;
    transactions: number;
    change: number;
  };
  week: {
    amount: number;
    transactions: number;
    change: number;
  };
  month: {
    amount: number;
    transactions: number;
    change: number;
  };
  year: {
    amount: number;
    transactions: number;
    change: number;
  };
  productMovements: {
    in: number;
    out: number;
    net: number;
  };
}

export interface DashboardResponse {
  success: boolean;
  stats: DashboardStats;
  recentTransactions: Transaction[];
  error?: string;
}

