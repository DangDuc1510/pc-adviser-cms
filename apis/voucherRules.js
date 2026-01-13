import { api } from "./axios";
import APIConfig from "./config";

export const VoucherRuleApi = {
  getAll(params = {}) {
    return api.get(`${APIConfig.base}/voucher-rules`, { params });
  },

  getById(id) {
    return api.get(`${APIConfig.base}/voucher-rules/${id}`);
  },

  create(data) {
    return api.post(`${APIConfig.base}/voucher-rules`, data);
  },

  update(id, data) {
    return api.put(`${APIConfig.base}/voucher-rules/${id}`, data);
  },

  delete(id) {
    return api.delete(`${APIConfig.base}/voucher-rules/${id}`);
  },

  toggle(id) {
    return api.post(`${APIConfig.base}/voucher-rules/${id}/toggle`);
  },
};

export const VoucherDistributionApi = {
  getAll(params = {}) {
    return api.get(`${APIConfig.base}/voucher-distributions`, { params });
  },

  getById(id) {
    return api.get(`${APIConfig.base}/voucher-distributions/${id}`);
  },

  getByUser(userId) {
    return api.get(`${APIConfig.base}/voucher-distributions/user/${userId}`);
  },

  getStats() {
    return api.get(`${APIConfig.base}/voucher-distributions/stats`);
  },
};

