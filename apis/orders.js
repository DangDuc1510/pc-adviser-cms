import { api } from "./axios";
import APIConfig from "./config";

export const OrderApi = {
    // Get all orders with pagination and filters
    getAll(params = {}) {
        const url = `${APIConfig.orders}`;
        return api.get(url, { params });
    },

    // Get order by ID
    getById(id) {
        const url = `${APIConfig.orders}/${id}`;
        return api.get(url);
    },

    // Get order by order number
    getByOrderNumber(orderNumber) {
        const url = `${APIConfig.orders}/number/${orderNumber}`;
        return api.get(url);
    },

    // Create new order
    create(data) {
        const url = `${APIConfig.orders}`;
        return api.post(url, data);
    },

    // Update order status
    updateStatus(id, data) {
        const url = `${APIConfig.orders}/${id}/status`;
        return api.patch(url, data);
    },

    // Cancel order
    cancel(id, data) {
        const url = `${APIConfig.orders}/${id}`;
        return api.delete(url, { data });
    },

    // Get order statistics
    getStats(params = {}) {
        const url = `${APIConfig.orders}/stats`;
        return api.get(url, { params });
    },

    // Get orders by status
    getByStatus() {
        const url = `${APIConfig.orders}/by-status`;
        return api.get(url);
    },
};

export const CartApi = {
    // Get cart
    get() {
        const url = `${APIConfig.cart}`;
        return api.get(url);
    },

    // Get cart summary
    getSummary() {
        const url = `${APIConfig.cart}/summary`;
        return api.get(url);
    },

    // Add item to cart
    addItem(data) {
        const url = `${APIConfig.cart}/items`;
        return api.post(url, data);
    },

    // Update item quantity
    updateItem(productId, data) {
        const url = `${APIConfig.cart}/items/${productId}`;
        return api.patch(url, data);
    },

    // Remove item from cart
    removeItem(productId) {
        const url = `${APIConfig.cart}/items/${productId}`;
        return api.delete(url);
    },

    // Clear cart
    clear() {
        const url = `${APIConfig.cart}/clear`;
        return api.delete(url);
    },

    // Apply coupon
    applyCoupon(data) {
        const url = `${APIConfig.cart}/coupon`;
        return api.post(url, data);
    },

    // Remove coupon
    removeCoupon() {
        const url = `${APIConfig.cart}/coupon`;
        return api.delete(url);
    },
};

export const PaymentApi = {
    // Create payment intent
    createIntent(data) {
        const url = `${APIConfig.payment}/create-intent`;
        return api.post(url, data);
    },

    // Mock confirm payment (development only)
    mockConfirm(orderId) {
        const url = `${APIConfig.payment}/mock-confirm/${orderId}`;
        return api.post(url);
    },

    // Get payment by order ID
    getByOrderId(orderId) {
        const url = `${APIConfig.payment}/order/${orderId}`;
        return api.get(url);
    },

    // Get payment by ID
    getById(id) {
        const url = `${APIConfig.payment}/${id}`;
        return api.get(url);
    },

    // Process refund
    processRefund(orderId, data) {
        const url = `${APIConfig.payment}/${orderId}/refund`;
        return api.post(url, data);
    },
};

export const PromoCodeApi = {
    // Get all promo codes with pagination and filters
    getAll(params = {}) {
        const url = `${APIConfig.promoCodes}`;
        return api.get(url, { params });
    },

    // Get promo code by ID
    getById(id) {
        const url = `${APIConfig.promoCodes}/${id}`;
        return api.get(url);
    },

    // Get promo code by code
    getByCode(code) {
        const url = `${APIConfig.promoCodes}/code/${code}`;
        return api.get(url);
    },

    // Create new promo code
    create(data) {
        const url = `${APIConfig.promoCodes}`;
        return api.post(url, data);
    },

    // Update promo code
    update(id, data) {
        const url = `${APIConfig.promoCodes}/${id}`;
        return api.put(url, data);
    },

    // Toggle active status
    toggleActive(id) {
        const url = `${APIConfig.promoCodes}/${id}/toggle-active`;
        return api.patch(url);
    },

    // Delete promo code
    delete(id) {
        const url = `${APIConfig.promoCodes}/${id}`;
        return api.delete(url);
    },

    // Get statistics
    getStats(params = {}) {
        const url = `${APIConfig.promoCodes}/stats`;
        return api.get(url, { params });
    },

    // Validate promo code (for cart/checkout)
    validate(data) {
        const url = `${APIConfig.promoCodes}/validate`;
        return api.post(url, data);
    },

    // Get valid promo codes for user
    getValid(params = {}) {
        const url = `${APIConfig.promoCodes}/valid`;
        return api.get(url, { params });
    },
};

