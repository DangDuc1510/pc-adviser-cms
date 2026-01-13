import { api } from './axios';
import APIConfig from './config';

export const BehaviorApi = {
  // Get customer behavior
  getCustomerBehavior: (customerId, params = {}) => {
    return api.get(`${APIConfig.base}/behavior/${customerId}`, { params });
  },

  // Get behavior summary
  getSummary: (customerId) => {
    return api.get(`${APIConfig.base}/behavior/${customerId}/summary`);
  },

  // Get behavior timeline
  getTimeline: (customerId, params = {}) => {
    return api.get(`${APIConfig.base}/behavior/${customerId}/timeline`, { params });
  },

  // Get product analytics
  getProductAnalytics: (productId, params = {}) => {
    return api.get(`${APIConfig.base}/behavior/analytics/products/${productId}`, { params });
  },

  // Get overview analytics
  getOverviewAnalytics: (params = {}) => {
    return api.get(`${APIConfig.base}/behavior/analytics/overview`, { params });
  }
};

