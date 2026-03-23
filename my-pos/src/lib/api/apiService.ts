/**
 * 🎯 MAIN API SERVICE
 * 
 * Central export point for all API services
 * Import this in your components: import { apiService } from '@/lib/api/apiService'
 */

import { authApi } from './auth';
import { productsApi } from './products';
import { transactionsApi } from './transactions';
import { dashboardApi } from './dashboard';
import { reportsApi } from './reports';
import { employeesApi } from './employees';

// Main API service object - exports all API functions
export const apiService = {
  auth: authApi,
  products: productsApi,
  employees: employeesApi,
  transactions: transactionsApi,
  dashboard: dashboardApi,
  reports: reportsApi,
};

// Default export
export default apiService;

