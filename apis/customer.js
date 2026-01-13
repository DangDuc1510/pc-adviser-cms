import { api } from './axios';
import APIConfig from './config';

export const CustomerApi = {
  // Get all customers
  getAll: (params = {}) => {
    return api.get(`${APIConfig.base}/customers`, { params });
  },

  // Get customer by ID
  getById: (id) => {
    return api.get(`${APIConfig.base}/customers/${id}`);
  },

  // Get customer stats
  getStats: () => {
    return api.get(`${APIConfig.base}/customers/stats`);
  },

  // Get customer behavior
  getBehavior: (id, params = {}) => {
    return api.get(`${APIConfig.base}/customers/${id}/behavior`, { params });
  },

  // Get customer orders
  getOrders: (id) => {
    return api.get(`${APIConfig.base}/customers/${id}/orders`);
  },

  // Update customer
  update: (id, data) => {
    return api.put(`${APIConfig.base}/customers/${id}`, data);
  }
};

