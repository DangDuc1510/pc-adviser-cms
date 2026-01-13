import { api } from "./axios";
import APIConfig from "./config";

export const StatisticsApi = {
  // Get dashboard statistics
  getDashboardStats() {
    return api.get(`${APIConfig.base}/statistics/dashboard`);
  },

  // Get orders chart data
  getOrdersChartData(params = {}) {
    return api.get(`${APIConfig.base}/statistics/orders/chart`, { params });
  },

  // Get revenue chart data
  getRevenueChartData(params = {}) {
    return api.get(`${APIConfig.base}/statistics/revenue/chart`, { params });
  },

  // Get orders by status
  getOrdersByStatus() {
    return api.get(`${APIConfig.base}/statistics/orders/status`);
  },

  // Get user growth statistics
  getUserGrowthStats() {
    return api.get(`${APIConfig.base}/statistics/users/growth`);
  },
};
