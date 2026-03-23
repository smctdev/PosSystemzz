/**
 * 👤 SHARED EMPLOYEES DATA STORE
 *
 * TODO: Replace with database in production
 */

export interface Employee {
  id: number;
  name: string;
  role?: string;
  address?: string;
}

export let employees: Employee[] = [
  {
    id: 1,
    name: "Ana Reyes",
    role: "Cashier",
    address: "128 Rizal Avenue, Ermita, Manila — Main store",
  },
  {
    id: 2,
    name: "John Cruz",
    role: "Cashier",
    address: "128 Rizal Avenue, Ermita, Manila — Main store",
  },
  {
    id: 3,
    name: "Miguel Torres",
    role: "Kitchen",
    address: "Calamba Industrial Park, Laguna — Warehouse",
  },
  { id: 4, name: "Sofia Lim", role: "Admin", address: "Remote / work from home" },
  {
    id: 5,
    name: "Rosa Mendoza",
    role: "Cashier",
    address: "45 Commonwealth Ave., Quezon City — North branch",
  },
];
