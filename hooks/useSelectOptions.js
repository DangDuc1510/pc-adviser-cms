'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BrandApi, CategoryApi } from '@/apis/products';

/**
 * Custom hook for loading select options
 */
export const useSelectOptions = () => {
  const queryClient = useQueryClient();

  const { data: brands = [], isLoading: brandsLoading } = useQuery({
    queryKey: ['brands', 'select-options'],
    queryFn: async () => {
      const params = { isActive: true };
      const response = await BrandApi.getAll(params);
      return response?.brands || response || [];
    },
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', 'select-options'],
    queryFn: async () => {
      const params = { isActive: true };
      const response = await CategoryApi.getAll(params);
      return response?.categories || response || [];
    },
  });

  const loadBrands = async (search = '') => {
    const params = {
      isActive: true,
      ...(search && { search })
    };
    
    const response = await BrandApi.getAll(params);
    const brandData = response?.brands || response || [];
    
    // Update cache
    queryClient.setQueryData(['brands', 'select-options', search], brandData);
    return brandData;
  };

  const loadCategories = async (search = '', filters = {}) => {
    const params = {
      isActive: true,
      ...(search && { search }),
      ...filters
    };
    
    const response = await CategoryApi.getAll(params);
    const categoryData = response?.categories || response || [];
    
    // Update cache
    queryClient.setQueryData(['categories', 'select-options', search, filters], categoryData);
    return categoryData;
  };

  const loadRootCategories = async (search = '') => {
    return await loadCategories(search, { level: 0 });
  };

  const loadCategoriesByComponentType = async (componentType, search = '') => {
    return await loadCategories(search, { componentType });
  };

  return {
    brands,
    categories,
    loading: {
      brands: brandsLoading,
      categories: categoriesLoading
    },
    loadBrands,
    loadCategories,
    loadRootCategories,
    loadCategoriesByComponentType
  };
};

/**
 * Hook for brand options
 */
export const useBrandOptions = () => {
  const queryClient = useQueryClient();

  const { data: brands = [], isLoading: loading } = useQuery({
    queryKey: ['brands', 'options'],
    queryFn: async () => {
      const params = { isActive: true };
      const response = await BrandApi.getAll(params);
      return response?.brands || response || [];
    },
  });

  const loadBrands = async (search = '') => {
    const params = {
      isActive: true,
      ...(search && { search })
    };
    
    const response = await BrandApi.getAll(params);
    const brandData = response?.brands || response || [];
    
    // Update cache
    queryClient.setQueryData(['brands', 'options', search], brandData);
    return brandData;
  };

  return {
    brands,
    loading,
    loadBrands
  };
};

/**
 * Hook for category options
 */
export const useCategoryOptions = (filters = {}) => {
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading: loading } = useQuery({
    queryKey: ['categories', 'options', filters],
    queryFn: async () => {
      const params = {
        isActive: true,
        ...filters
      };
      
      const response = await CategoryApi.getAll(params);
      return response?.categories || response || [];
    },
  });

  const loadCategories = async (search = '') => {
    const params = {
      isActive: true,
      ...(search && { search }),
      ...filters
    };
    
    const response = await CategoryApi.getAll(params);
    const categoryData = response?.categories || response || [];
    
    // Update cache
    queryClient.setQueryData(['categories', 'options', filters, search], categoryData);
    return categoryData;
  };

  return {
    categories,
    loading,
    loadCategories
  };
};
