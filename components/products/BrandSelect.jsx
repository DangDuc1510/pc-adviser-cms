'use client';

import { BrandApi } from '@/apis/products';
import SearchableSelect from '../common/SearchableSelect';

/**
 * Brand Select Component
 * Searchable select component for brands with full data loading
 */
const BrandSelect = (props) => {
  const fetchBrands = async ({ search = '' }) => {
    try {
      // Fetch all active brands for selection
      const params = {
        isActive: true,
        ...(search && { search })
      };
      
      const response = await BrandApi.getAll(params);
      return response?.brands || response || [];
    } catch (error) {
      console.error('Error fetching brands:', error);
      return [];
    }
  };

  return (
    <SearchableSelect
      fetchData={fetchBrands}
      labelField="name"
      valueField="_id"
      placeholder="Chọn thương hiệu..."
      showSearch={true}
      minSearchLength={1}
      {...props}
    />
  );
};

export default BrandSelect;
