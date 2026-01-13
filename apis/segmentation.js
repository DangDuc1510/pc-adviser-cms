import { api } from './axios';
import APIConfig from './config';

export const SegmentationApi = {
  // Analyze single customer by userId
  // If userId is provided, use it; otherwise fallback to customerId
  analyzeCustomer: (userId, params = {}) => {
    return api.get(`${APIConfig.base}/segmentation/analyze/${userId}`, { params });
  },

  // Force analyze single customer by userId
  // If userId is provided, use it; otherwise fallback to customerId
  forceAnalyzeCustomer: (userId) => {
    return api.post(`${APIConfig.base}/segmentation/analyze/${userId}`, {}, {
      params: { forceUpdate: true }
    });
  },

  // Analyze multiple customers (batch)
  analyzeCustomers: (customerIds, params = {}) => {
    return api.post(`${APIConfig.base}/segmentation/analyze/batch`, { customerIds }, { params });
  },

  // Analyze all customers (no limit, sorted by updatedAt)
  analyzeAllCustomers: (params = {}) => {
    return api.post(`${APIConfig.base}/segmentation/analyze/all`, {}, { params });
  },

  // Get segmentation statistics
  getStats: () => {
    return api.get(`${APIConfig.base}/segmentation/stats`);
  },

  // Get customers by segmentation type
  getCustomersBySegment: (type, params = {}) => {
    return api.get(`${APIConfig.base}/segmentation/customers/${type}`, { params });
  },

  // Get users by segmentation type (for promo code selection)
  getUsersBySegment: async (type, params = {}) => {
    const response = await api.get(`${APIConfig.base}/segmentation/customers/${type}`, { 
      params: { ...params, limit: params.limit || 1000 } 
    });
    // Handle different response formats
    const users = response.data?.data?.users || response.data?.users || response.data?.data?.customers || [];
    return Array.isArray(users) ? users : [];
  },

  // Voucher recommendations by userId
  // If userId is provided, use it; otherwise fallback to customerId
  getVoucherRecommendation: (userId, params = {}) => {
    return api.get(`${APIConfig.base}/segmentation/voucher-recommendation/${userId}`, { params });
  },

  getBulkVoucherRecommendations: (userIds, params = {}) => {
    return api.post(`${APIConfig.base}/segmentation/voucher-recommendation/bulk`, { userIds, ...params });
  },

  getVoucherStatsBySegmentation: () => {
    return api.get(`${APIConfig.base}/segmentation/voucher-recommendation/stats`);
  }
};

