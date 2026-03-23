/**
 * 👤 EMPLOYEES API
 */

import axiosClient from "./axiosClient";
import { EMPLOYEE_ADDRESS_OPTIONS } from "../employee-address-options";
import type {
  EmployeesResponse,
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  EmployeeResponse,
  DeleteEmployeeResponse,
} from "./types";

const MOCK_SEED: Employee[] = [
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

const USE_MOCK = false;

let mockEmployeesStore: Employee[] = [...MOCK_SEED];

export const employeesApi = {
  getAll: async (): Promise<EmployeesResponse> => {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      return { success: true, employees: [...mockEmployeesStore] };
    }
    return axiosClient.get<EmployeesResponse>("/employees");
  },

  create: async (data: CreateEmployeeRequest): Promise<EmployeeResponse> => {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      const name = data.name.trim();
      if (!name) {
        return { success: false, error: "Name is required" };
      }
      const role = data.role?.trim() || undefined;
      const addressTrim = data.address?.trim();
      if (!addressTrim) {
        return { success: false, error: "Address is required" };
      }
      if (!EMPLOYEE_ADDRESS_OPTIONS.includes(addressTrim)) {
        return { success: false, error: "Invalid address selection" };
      }
      const address = addressTrim;
      const newId =
        mockEmployeesStore.length > 0
          ? Math.max(...mockEmployeesStore.map((e) => e.id)) + 1
          : 1;
      const employee: Employee = { id: newId, name, role, address };
      mockEmployeesStore = [...mockEmployeesStore, employee];
      return {
        success: true,
        employee,
        message: "Employee added successfully",
      };
    }
    return axiosClient.post<EmployeeResponse>("/employees", data);
  },

  getById: async (id: number): Promise<EmployeeResponse> => {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 200));
      const employee = mockEmployeesStore.find((e) => e.id === id);
      if (!employee) {
        return { success: false, error: "Employee not found" };
      }
      return { success: true, employee };
    }
    return axiosClient.get<EmployeeResponse>(`/employees/${id}`);
  },

  update: async (data: UpdateEmployeeRequest): Promise<EmployeeResponse> => {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      const name = data.name.trim();
      if (!name) {
        return { success: false, error: "Name is required" };
      }
      const addressTrim = data.address?.trim();
      if (!addressTrim) {
        return { success: false, error: "Address is required" };
      }
      if (!EMPLOYEE_ADDRESS_OPTIONS.includes(addressTrim)) {
        return { success: false, error: "Invalid address selection" };
      }
      const idx = mockEmployeesStore.findIndex((e) => e.id === data.id);
      if (idx === -1) {
        return { success: false, error: "Employee not found" };
      }
      const role = data.role?.trim() || undefined;
      const employee: Employee = {
        ...mockEmployeesStore[idx],
        name,
        role,
        address: addressTrim,
      };
      mockEmployeesStore = mockEmployeesStore.map((e) =>
        e.id === data.id ? employee : e
      );
      return {
        success: true,
        employee,
        message: "Employee updated successfully",
      };
    }
    const { id, ...body } = data;
    return axiosClient.put<EmployeeResponse>(`/employees/${id}`, body);
  },

  delete: async (id: number): Promise<DeleteEmployeeResponse> => {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      const idx = mockEmployeesStore.findIndex((e) => e.id === id);
      if (idx === -1) {
        return { success: false, error: "Employee not found" };
      }
      mockEmployeesStore = mockEmployeesStore.filter((e) => e.id !== id);
      return { success: true, message: "Employee deleted successfully" };
    }
    return axiosClient.delete<DeleteEmployeeResponse>(`/employees/${id}`);
  },
};
