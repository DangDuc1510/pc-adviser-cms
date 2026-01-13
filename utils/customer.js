/**
 * Helper functions for customer operations
 */

/**
 * Extract userId from customer object
 * Customer object can have userId as:
 * - Object with _id property: { userId: { _id: '...', ... } }
 * - String/ObjectId: { userId: '...' }
 * - null/undefined: { userId: null }
 *
 * @param {Object} customer - Customer object
 * @returns {String|null} userId or null if not available
 */
export const extractUserId = (customer) => {
  if (!customer || !customer.userId) {
    return null;
  }

  // If userId is an object with _id
  if (typeof customer.userId === "object" && customer.userId._id) {
    return customer.userId._id.toString();
  }

  // If userId is already a string or ObjectId
  if (typeof customer.userId === "string" || customer.userId.toString) {
    return customer.userId.toString();
  }

  return null;
};

/**
 * Check if customer has userId (is registered customer)
 * @param {Object} customer - Customer object
 * @returns {Boolean} true if customer has userId
 */
export const hasUserId = (customer) => {
  return !!extractUserId(customer);
};
