/**
 * Format price to VND currency
 * @param {number} price - Price value
 * @param {boolean} showCurrency - Show currency symbol
 * @returns {string} Formatted price
 */
export const formatPrice = (price, showCurrency = true) => {
  if (price === null || price === undefined) return '0₫';
  
  const formatted = new Intl.NumberFormat('vi-VN').format(price);
  return showCurrency ? `${formatted}₫` : formatted;
};

