'use client';

import { useState, useEffect, useMemo } from 'react';
import { Select, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { Option } = Select;

/**
 * SearchableSelect Component
 * A reusable select component with search functionality
 * 
 * @param {Function} fetchData - Function to fetch data, should return array of items
 * @param {String} labelField - Field name for display label (default: 'name')
 * @param {String} valueField - Field name for value (default: '_id')
 * @param {String} placeholder - Placeholder text
 * @param {Boolean} allowClear - Allow clear selection (default: true)
 * @param {Function} onChange - Callback when selection changes
 * @param {Any} value - Current selected value
 * @param {Object} style - Custom styles
 * @param {Boolean} disabled - Disable the select
 * @param {Number} debounceMs - Debounce time for search (default: 300)
 * @param {Function} filterOption - Custom filter function
 * @param {Boolean} showSearch - Enable search functionality (default: true)
 * @param {Number} minSearchLength - Minimum search length to trigger search (default: 0)
 */
const SearchableSelect = ({
  fetchData,
  labelField = 'name',
  valueField = '_id',
  placeholder = 'Chọn...',
  allowClear = true,
  onChange,
  value,
  style,
  disabled = false,
  debounceMs = 300,
  filterOption,
  showSearch = true,
  minSearchLength = 0,
  ...props
}) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Debounced search
  useEffect(() => {
    if (!showSearch) return;
    
    const timeoutId = setTimeout(() => {
      if (searchText.length >= minSearchLength) {
        loadData(searchText);
      } else if (searchText.length === 0) {
        loadData();
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [searchText, debounceMs, minSearchLength, showSearch]);

  const loadData = async (search = '') => {
    try {
      setLoading(true);
      const data = await fetchData({ search });
      setOptions(data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const defaultFilterOption = (input, option) => {
    if (!option || !option.children) return false;
    return option.children.toLowerCase().includes(input.toLowerCase());
  };

  const filteredOptions = useMemo(() => {
    if (!showSearch || !filterOption) return options;
    
    return options.filter(item => 
      filterOption(searchText, item, labelField, valueField)
    );
  }, [options, searchText, filterOption, showSearch, labelField, valueField]);

  return (
    <Select
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      allowClear={allowClear}
      style={style}
      disabled={disabled}
      loading={loading}
      showSearch={showSearch}
      filterOption={showSearch && !filterOption ? defaultFilterOption : false}
      onSearch={showSearch ? handleSearch : undefined}
      notFoundContent={loading ? <Spin size="small" /> : 'Không có dữ liệu'}
      suffixIcon={showSearch ? <SearchOutlined /> : undefined}
      {...props}
    >
      {(filterOption ? filteredOptions : options).map(item => (
        <Option 
          key={item[valueField]} 
          value={item[valueField]}
          title={item[labelField]}
        >
          {item[labelField]}
        </Option>
      ))}
    </Select>
  );
};

export default SearchableSelect;
