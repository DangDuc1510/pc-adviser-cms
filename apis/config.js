const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

const APIConfig = {
  base,
  auth: `${base}/auth`,
  user: `${base}/user`,
  products: `${base}/products`,
  categories: `${base}/categories`,
  brands: `${base}/brands`,
  productGroups: `${base}/product-groups`,
  orders: `${base}/orders`,
  cart: `${base}/cart`,
  payment: `${base}/payment`,
  payments: `${base}/payments`,
  reviews: `${base}/reviews`,
  contacts: `${base}/contacts`,
  promoCodes: `${base}/promo-codes`,
  segmentation: `${base}/segmentation`,
};

export default APIConfig;
