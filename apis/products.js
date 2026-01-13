import { api } from "./axios";
import APIConfig from "./config";

export const ProductApi = {
  // Get all products with pagination and filters
  getAll(params = {}) {
    const url = `${APIConfig.products}`;
    return api.get(url, { params });
  },

  // Get product by ID
  getById(id) {
    const url = `${APIConfig.products}/${id}`;
    return api.get(url);
  },

  // Get product by slug
  getBySlug(slug) {
    const url = `${APIConfig.products}/slug/${slug}`;
    return api.get(url);
  },

  // Get featured products
  getFeatured(params = {}) {
    const url = `${APIConfig.products}/featured`;
    return api.get(url, { params });
  },

  // Get products on sale
  getOnSale(params = {}) {
    const url = `${APIConfig.products}/sale`;
    return api.get(url, { params });
  },

  // Search products
  search(params) {
    const url = `${APIConfig.products}/search`;
    return api.get(url, { params });
  },

  // Create new product
  create(data) {
    const url = `${APIConfig.products}`;
    return api.post(url, data);
  },

  // Update product
  update(id, data) {
    const url = `${APIConfig.products}/${id}`;
    return api.put(url, data);
  },

  // Update product stock
  updateStock(id, data) {
    const url = `${APIConfig.products}/${id}/stock`;
    return api.patch(url, data);
  },

  // Toggle product active status
  toggleStatus(id) {
    const url = `${APIConfig.products}/${id}/toggle-status`;
    return api.patch(url);
  },

  // Toggle product featured status
  toggleFeatured(id) {
    const url = `${APIConfig.products}/${id}/toggle-featured`;
    return api.patch(url);
  },

  // Delete product
  delete(id) {
    const url = `${APIConfig.products}/${id}`;
    return api.delete(url);
  },

  // Bulk update status
  bulkUpdateStatus(data) {
    const url = `${APIConfig.products}/bulk/update-status`;
    return api.post(url, data);
  },

  // Bulk delete
  bulkDelete(data) {
    const url = `${APIConfig.products}/bulk/delete`;
    return api.post(url, data);
  },

  // Image management
  uploadImages(id, formData) {
    const url = `${APIConfig.products}/${id}/upload-images`;
    return api.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  uploadSingleImage(id, formData) {
    const url = `${APIConfig.products}/${id}/upload-image`;
    return api.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  deleteImage(id, imageIndex) {
    const url = `${APIConfig.products}/${id}/images/${imageIndex}`;
    return api.delete(url);
  },

  setPrimaryImage(id, imageIndex) {
    const url = `${APIConfig.products}/${id}/images/${imageIndex}/primary`;
    return api.patch(url);
  },
};

export const CategoryApi = {
  // Get all categories with pagination and filters
  getAll(params = {}) {
    const url = `${APIConfig.categories}`;
    return api.get(url, { params });
  },

  // Get category hierarchy
  getHierarchy(params = {}) {
    const url = `${APIConfig.categories}/hierarchy`;
    return api.get(url, { params });
  },

  // Get categories with product count
  getWithProductCount(params = {}) {
    const url = `${APIConfig.categories}/with-products`;
    return api.get(url, { params });
  },

  // Get root categories
  getRootCategories(params = {}) {
    const url = `${APIConfig.categories}/root`;
    return api.get(url, { params });
  },

  // Get child categories
  getChildCategories(parentId, params = {}) {
    const url = `${APIConfig.categories}/${parentId}/children`;
    return api.get(url, { params });
  },

  // Get categories by component type
  getByComponentType(componentType) {
    const url = `${APIConfig.categories}/component/${componentType}`;
    return api.get(url);
  },

  // Get category by ID
  getById(id) {
    const url = `${APIConfig.categories}/${id}`;
    return api.get(url);
  },

  // Get category by slug
  getBySlug(slug) {
    const url = `${APIConfig.categories}/slug/${slug}`;
    return api.get(url);
  },

  // Get category path (breadcrumb)
  getCategoryPath(id) {
    const url = `${APIConfig.categories}/${id}/path`;
    return api.get(url);
  },

  // Create new category
  create(data) {
    const url = `${APIConfig.categories}`;
    return api.post(url, data);
  },

  // Update category
  update(id, data) {
    const url = `${APIConfig.categories}/${id}`;
    return api.put(url, data);
  },

  // Update category sort order
  updateSortOrder(id, data) {
    const url = `${APIConfig.categories}/${id}/sort-order`;
    return api.patch(url, data);
  },

  // Toggle category status
  toggleStatus(id) {
    const url = `${APIConfig.categories}/${id}/toggle-status`;
    return api.patch(url);
  },

  // Search categories
  search(params) {
    const url = `${APIConfig.categories}/search`;
    return api.get(url, { params });
  },

  // Get category statistics
  getStats(id) {
    const url = `${APIConfig.categories}/${id}/stats`;
    return api.get(url);
  },

  // Delete category
  delete(id) {
    const url = `${APIConfig.categories}/${id}`;
    return api.delete(url);
  },

  // Image management
  uploadImage(id, formData) {
    const url = `${APIConfig.categories}/${id}/upload-image`;
    return api.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  deleteImage(id) {
    const url = `${APIConfig.categories}/${id}/delete-image`;
    return api.delete(url);
  },
};

export const BrandApi = {
  // Get all brands with pagination and filters
  getAll(params = {}) {
    const url = `${APIConfig.brands}`;
    return api.get(url, { params });
  },

  // Get brands with product count
  getWithProductCount(params = {}) {
    const url = `${APIConfig.brands}/with-products`;
    return api.get(url, { params });
  },

  // Get popular brands
  getPopular(params = {}) {
    const url = `${APIConfig.brands}/popular`;
    return api.get(url, { params });
  },

  // Get active brands
  getActive(params = {}) {
    const url = `${APIConfig.brands}/active`;
    return api.get(url, { params });
  },

  // Get brands grouped by country
  getGroupedByCountry(params = {}) {
    const url = `${APIConfig.brands}/grouped-by-country`;
    return api.get(url, { params });
  },

  // Get brand by ID
  getById(id) {
    const url = `${APIConfig.brands}/${id}`;
    return api.get(url);
  },

  // Get brand by slug
  getBySlug(slug) {
    const url = `${APIConfig.brands}/slug/${slug}`;
    return api.get(url);
  },

  // Get brands by country
  getByCountry(country, params = {}) {
    const url = `${APIConfig.brands}/country/${country}`;
    return api.get(url, { params });
  },

  // Get brands by category
  getByCategory(categoryId, params = {}) {
    const url = `${APIConfig.brands}/category/${categoryId}`;
    return api.get(url, { params });
  },

  // Get brand statistics
  getStats(id) {
    const url = `${APIConfig.brands}/${id}/stats`;
    return api.get(url);
  },

  // Create new brand
  create(data) {
    const url = `${APIConfig.brands}`;
    return api.post(url, data);
  },

  // Update brand
  update(id, data) {
    const url = `${APIConfig.brands}/${id}`;
    return api.put(url, data);
  },

  // Toggle brand status
  toggleStatus(id) {
    const url = `${APIConfig.brands}/${id}/toggle-status`;
    return api.patch(url);
  },

  // Search brands
  search(params) {
    const url = `${APIConfig.brands}/search`;
    return api.get(url, { params });
  },

  // Bulk update brand status
  bulkUpdateStatus(data) {
    const url = `${APIConfig.brands}/bulk/update-status`;
    return api.post(url, data);
  },

  // Delete brand
  delete(id) {
    const url = `${APIConfig.brands}/${id}`;
    return api.delete(url);
  },

  // Logo management
  uploadLogo(id, formData) {
    const url = `${APIConfig.brands}/${id}/upload-logo`;
    return api.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  deleteLogo(id) {
    const url = `${APIConfig.brands}/${id}/delete-logo`;
    return api.delete(url);
  },
};

export const ProductGroupApi = {
  // Get all product groups with pagination and filters
  getAll(params = {}) {
    const url = `${APIConfig.productGroups}`;
    return api.get(url, { params });
  },

  // Get product group by ID
  getById(id) {
    const url = `${APIConfig.productGroups}/${id}`;
    return api.get(url);
  },

  // Get public product groups
  getPublic(params = {}) {
    const url = `${APIConfig.productGroups}/public`;
    return api.get(url, { params });
  },

  // Get product groups by user
  getByUser(userId, params = {}) {
    const url = `${APIConfig.productGroups}/user/${userId}`;
    return api.get(url, { params });
  },

  // Create new product group
  create(data) {
    const url = `${APIConfig.productGroups}`;
    return api.post(url, data);
  },

  // Update product group
  update(id, data) {
    const url = `${APIConfig.productGroups}/${id}`;
    return api.put(url, data);
  },

  // Delete product group
  delete(id) {
    const url = `${APIConfig.productGroups}/${id}`;
    return api.delete(url);
  },

  // Toggle product group status
  toggleStatus(id) {
    const url = `${APIConfig.productGroups}/${id}/toggle-status`;
    return api.patch(url);
  },

  // Add product to group
  addProduct(groupId, data) {
    const url = `${APIConfig.productGroups}/${groupId}/products`;
    return api.post(url, data);
  },

  // Remove product from group
  removeProduct(groupId, productId) {
    const url = `${APIConfig.productGroups}/${groupId}/products/${productId}`;
    return api.delete(url);
  },

  // Update product quantity in group
  updateProductQuantity(groupId, data) {
    const url = `${APIConfig.productGroups}/${groupId}/products`;
    return api.patch(url, data);
  },
};
