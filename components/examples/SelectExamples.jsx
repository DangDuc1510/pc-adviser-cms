'use client';

import { useState } from 'react';
import { Card, Row, Col, Typography, Space, Form, Button } from 'antd';
import BrandSelect from '../products/BrandSelect';
import CategorySelect from '../products/CategorySelect';
import SearchableSelect from '../common/SearchableSelect';
import { useSelectOptions } from '@/hooks/useSelectOptions';

const { Title, Text } = Typography;

/**
 * Examples of how to use the enhanced select components
 */
const SelectExamples = () => {
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedRootCategory, setSelectedRootCategory] = useState(null);
  const { brands, categories, loading } = useSelectOptions();

  const handleSubmit = () => {
    console.log('Selected values:', {
      brand: selectedBrand,
      category: selectedCategory,
      rootCategory: selectedRootCategory
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Select Components Examples</Title>
      
      <Row gutter={[16, 16]}>
        {/* Basic Brand Select */}
        <Col span={24}>
          <Card title="Brand Select - Có tìm kiếm">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>Chọn thương hiệu với tính năng tìm kiếm:</Text>
              <BrandSelect
                value={selectedBrand}
                onChange={setSelectedBrand}
                style={{ width: 300 }}
              />
              <Text type="secondary">
                Selected: {selectedBrand || 'None'}
              </Text>
            </Space>
          </Card>
        </Col>

        {/* Basic Category Select */}
        <Col span={24}>
          <Card title="Category Select - Có tìm kiếm">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>Chọn danh mục với tính năng tìm kiếm:</Text>
              <CategorySelect
                value={selectedCategory}
                onChange={setSelectedCategory}
                style={{ width: 300 }}
              />
              <Text type="secondary">
                Selected: {selectedCategory || 'None'}
              </Text>
            </Space>
          </Card>
        </Col>

        {/* Root Categories Only */}
        <Col span={24}>
          <Card title="Root Categories Only">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>Chỉ hiển thị danh mục gốc (level 0):</Text>
              <CategorySelect
                value={selectedRootCategory}
                onChange={setSelectedRootCategory}
                showOnlyRoot={true}
                style={{ width: 300 }}
              />
              <Text type="secondary">
                Selected: {selectedRootCategory || 'None'}
              </Text>
            </Space>
          </Card>
        </Col>

        {/* Component Type Filter */}
        <Col span={24}>
          <Card title="Categories by Component Type">
            <Row gutter={16}>
              <Col span={8}>
                <Text>CPU Categories:</Text>
                <CategorySelect
                  componentType="CPU"
                  style={{ width: '100%', marginTop: 8 }}
                  placeholder="Chọn danh mục CPU..."
                />
              </Col>
              <Col span={8}>
                <Text>VGA Categories:</Text>
                <CategorySelect
                  componentType="VGA"
                  style={{ width: '100%', marginTop: 8 }}
                  placeholder="Chọn danh mục VGA..."
                />
              </Col>
              <Col span={8}>
                <Text>RAM Categories:</Text>
                <CategorySelect
                  componentType="RAM"
                  style={{ width: '100%', marginTop: 8 }}
                  placeholder="Chọn danh mục RAM..."
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Form Example */}
        <Col span={24}>
          <Card title="Form Integration Example">
            <Form layout="vertical" onFinish={handleSubmit}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Thương hiệu"
                    name="brandId"
                    rules={[{ required: true, message: 'Vui lòng chọn thương hiệu' }]}
                  >
                    <BrandSelect style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Danh mục"
                    name="categoryId"
                    rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                  >
                    <CategorySelect style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Submit
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Custom SearchableSelect */}
        <Col span={24}>
          <Card title="Custom SearchableSelect">
            <Text>Sử dụng SearchableSelect với custom fetch function:</Text>
            <SearchableSelect
              fetchData={async ({ search }) => {
                // Custom fetch logic
                return brands.filter(brand => 
                  !search || brand.name.toLowerCase().includes(search.toLowerCase())
                );
              }}
              labelField="name"
              valueField="_id"
              placeholder="Custom brand select..."
              style={{ width: 300, marginTop: 8 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Usage Information */}
      <Card title="Cách sử dụng" style={{ marginTop: 24 }}>
        <Space direction="vertical">
          <Title level={4}>BrandSelect</Title>
          <Text code>{'<BrandSelect value={value} onChange={onChange} />'}</Text>
          
          <Title level={4}>CategorySelect</Title>
          <Text code>{'<CategorySelect value={value} onChange={onChange} showOnlyRoot={true} componentType="CPU" />'}</Text>
          
          <Title level={4}>SearchableSelect</Title>
          <Text code>{'<SearchableSelect fetchData={fetchFunction} labelField="name" valueField="_id" />'}</Text>
          
          <Text>
            Tất cả components đều hỗ trợ tìm kiếm realtime, debounce, và loading states.
            Dữ liệu được fetch từ server với pagination và filtering.
          </Text>
        </Space>
      </Card>
    </div>
  );
};

export default SelectExamples;
