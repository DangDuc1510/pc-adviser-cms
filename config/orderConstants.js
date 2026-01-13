// Order Status - Must match backend order-service/src/constants/index.js
export const ORDER_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  PREPARING: 'preparing',
  READY_TO_SHIP: 'ready_to_ship',
  SHIPPED: 'shipped',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  PAYMENT_FAILED: 'payment_failed',
};

// Order Status Labels (Vietnamese)
export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING_PAYMENT]: 'Chờ thanh toán',
  [ORDER_STATUS.PENDING]: 'Chờ xác nhận',
  [ORDER_STATUS.CONFIRMED]: 'Đã xác nhận',
  [ORDER_STATUS.PROCESSING]: 'Đang xử lý',
  [ORDER_STATUS.PREPARING]: 'Đang chuẩn bị hàng',
  [ORDER_STATUS.READY_TO_SHIP]: 'Sẵn sàng giao hàng',
  [ORDER_STATUS.SHIPPED]: 'Đã bàn giao vận chuyển',
  [ORDER_STATUS.IN_TRANSIT]: 'Đang vận chuyển',
  [ORDER_STATUS.DELIVERED]: 'Đã giao hàng',
  [ORDER_STATUS.COMPLETED]: 'Hoàn thành',
  [ORDER_STATUS.CANCELLED]: 'Đã hủy',
  [ORDER_STATUS.REFUNDED]: 'Đã hoàn tiền',
  [ORDER_STATUS.PAYMENT_FAILED]: 'Thanh toán thất bại',
};

// Order Status Colors
export const ORDER_STATUS_COLORS = {
  [ORDER_STATUS.PENDING_PAYMENT]: 'orange',
  [ORDER_STATUS.PAYMENT_FAILED]: 'red',
  [ORDER_STATUS.PENDING]: 'orange',
  [ORDER_STATUS.CONFIRMED]: 'blue',
  [ORDER_STATUS.PROCESSING]: 'cyan',
  [ORDER_STATUS.PREPARING]: 'geekblue',
  [ORDER_STATUS.READY_TO_SHIP]: 'purple',
  [ORDER_STATUS.SHIPPED]: 'lime',
  [ORDER_STATUS.IN_TRANSIT]: 'gold',
  [ORDER_STATUS.DELIVERED]: 'green',
  [ORDER_STATUS.COMPLETED]: 'success',
  [ORDER_STATUS.CANCELLED]: 'red',
  [ORDER_STATUS.REFUNDED]: 'volcano',
};

// Valid Order Status Transitions - Must match backend VALID_STATUS_TRANSITIONS
export const VALID_STATUS_TRANSITIONS = {
  // PENDING_PAYMENT: Can transition to CONFIRMED (after payment), PROCESSING (legacy), PENDING (if switch to COD), or error states
  [ORDER_STATUS.PENDING_PAYMENT]: [
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.PENDING,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.PAYMENT_FAILED,
  ],
  // PAYMENT_FAILED: Can retry payment or cancel
  [ORDER_STATUS.PAYMENT_FAILED]: [
    ORDER_STATUS.PENDING_PAYMENT,
    ORDER_STATUS.CANCELLED,
  ],
  // PENDING (COD): Can transition to CONFIRMED (after admin confirms) or PENDING_PAYMENT (if switch to VNPAY)
  [ORDER_STATUS.PENDING]: [
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.PENDING_PAYMENT,
    ORDER_STATUS.CANCELLED,
  ],
  // CONFIRMED: Can start processing or cancel
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
  // PROCESSING: Can move to preparing or cancel
  [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED],
  // PREPARING: Can move to ready to ship or cancel
  [ORDER_STATUS.PREPARING]: [
    ORDER_STATUS.READY_TO_SHIP,
    ORDER_STATUS.CANCELLED,
  ],
  // READY_TO_SHIP: Can ship or cancel
  [ORDER_STATUS.READY_TO_SHIP]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
  // SHIPPED: Can move to in transit (or directly to delivered if tracking not needed)
  [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.IN_TRANSIT, ORDER_STATUS.DELIVERED],
  // IN_TRANSIT: Can move to delivered
  [ORDER_STATUS.IN_TRANSIT]: [ORDER_STATUS.DELIVERED],
  // DELIVERED: Can complete or refund
  [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.COMPLETED, ORDER_STATUS.REFUNDED],
  // COMPLETED: Can refund if needed
  [ORDER_STATUS.COMPLETED]: [ORDER_STATUS.REFUNDED],
  // Terminal states: Cannot transition from these
  [ORDER_STATUS.CANCELLED]: [],
  [ORDER_STATUS.REFUNDED]: [],
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
};

// Payment Status Labels
export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUS.PENDING]: 'Chờ thanh toán',
  [PAYMENT_STATUS.PROCESSING]: 'Đang xử lý',
  [PAYMENT_STATUS.PAID]: 'Đã thanh toán',
  [PAYMENT_STATUS.FAILED]: 'Thanh toán thất bại',
  [PAYMENT_STATUS.REFUNDED]: 'Đã hoàn tiền',
  [PAYMENT_STATUS.CANCELLED]: 'Đã hủy',
};

// Payment Status Colors
export const PAYMENT_STATUS_COLORS = {
  [PAYMENT_STATUS.PENDING]: 'orange',
  [PAYMENT_STATUS.PROCESSING]: 'blue',
  [PAYMENT_STATUS.PAID]: 'green',
  [PAYMENT_STATUS.FAILED]: 'red',
  [PAYMENT_STATUS.REFUNDED]: 'volcano',
  [PAYMENT_STATUS.CANCELLED]: 'default',
};

