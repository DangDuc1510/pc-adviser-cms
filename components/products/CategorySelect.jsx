'use client';

import { CategoryApi } from '@/apis/products';
import SearchableSelect from '../common/SearchableSelect';

/**
 * Category Select Component
 * Searchable select component for categories with full data loading
 */
const CategorySelect = ({ 
  showOnlyRoot = false, 
  showOnlyLeaf = false,
  componentType = null,
  ...props 
}) => {
  const fetchCategories = async ({ search = '' }) => {
    try {
      // Build params based on props
      const params = {
        isActive: true,
        ...(search && { search }),
        ...(componentType && { componentType })
      };

      // Add level filter if needed
      if (showOnlyRoot) {
        params.level = 0;
      }

      const response = await CategoryApi.getAll(params);
      let categories = response?.categories || response || [];

      // Filter for leaf categories (no children) if requested
      if (showOnlyLeaf && categories.length > 0) {
        // This is a simple check - in a more complex scenario, you might need to 
        // fetch the hierarchy to determine leaf nodes properly
        categories = categories.filter(cat => cat.level > 0);
      }

      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  };

  return (
    <SearchableSelect
      fetchData={fetchCategories}
      labelField="name"
      valueField="_id"
      placeholder="Chọn danh mục..."
      showSearch={true}
      minSearchLength={1}
      {...props}
    />
  );
};

export default CategorySelect;
