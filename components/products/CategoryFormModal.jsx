'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Card,
  Row,
  Col,
  message,
  Space,
  Button,
  TreeSelect,
  Avatar
} from 'antd';
import { CategoryApi } from '@/apis/products';
import ImageUpload from '@/components/common/ImageUpload';

const { Option } = Select;
const { TextArea } = Input;

const CategoryFormModal = ({ 
  visible, 
  onCancel, 
  onSuccess, 
  category = null, // null for create, object for edit
  categories = []
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [parentCategories, setParentCategories] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');

  const isEditMode = !!category;

  const componentTypes = [
    'CPU', 'VGA', 'RAM', 'Mainboard', 'Storage', 'PSU', 
    'Case', 'Cooling', 'Monitor', 'Keyboard', 'Mouse', 
    'Headset', 'Webcam', 'Audio', 'Networking', 'Other'
  ];

  useEffect(() => {
    if (visible) {
      // Prepare parent categories (exclude current category and its children)
      let availableParents = categories.filter(cat => {
        if (isEditMode) {
          // Exclude self and children to prevent circular references
          return cat._id !== category._id && cat.parentId !== category._id;
        }
        return true;
      });

      // Only allow categories with level < 2 to be parents (max 3 levels: 0, 1, 2)
      availableParents = availableParents.filter(cat => (cat.level || 0) < 2);
      
      setParentCategories(availableParents);

      if (isEditMode) {
        // Populate form with existing category data
        form.setFieldsValue({
          name: category.name,
          description: category.description,
          componentType: category.componentType,
          parentId: category.parentId || null,
          sortOrder: category.sortOrder || 0,
          isActive: category.isActive,
          metaTitle: category.metaTitle,
          metaDescription: category.metaDescription,
          metaKeywords: category.metaKeywords?.join(', '),
        });
        setCurrentImageUrl(category.imageUrl || '');
      } else {
        // Reset form for create mode
        form.resetFields();
        form.setFieldsValue({
          isActive: true,
          sortOrder: 0
        });
        setCurrentImageUrl('');
      }
    }
  }, [visible, category, isEditMode, categories, form]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const categoryData = {
        name: values.name,
        description: values.description,
        componentType: values.componentType,
        parentId: values.parentId || null,
        sortOrder: values.sortOrder || 0,
        isActive: values.isActive !== false,
        metaTitle: values.metaTitle || values.name,
        metaDescription: values.metaDescription,
        metaKeywords: values.metaKeywords 
          ? values.metaKeywords.split(',').map(k => k.trim()).filter(k => k) 
          : []
      };

      let result;
      if (isEditMode) {
        result = await CategoryApi.update(category._id, categoryData);
      } else {
        result = await CategoryApi.create(categoryData);
      }

      // Upload image if new file selected
      const categoryId = result?.data?._id || result?._id || (isEditMode ? category._id : null);
      
      let finalCategoryData = result?.data || result;
      
      if (imageFile && categoryId) {
        try {
          const formData = new FormData();
          formData.append('image', imageFile);
          
          const uploadResult = await CategoryApi.uploadImage(categoryId, formData);
          
          // Extract image URL from response
          const imageUrl = uploadResult?.data?.data?.image?.url || 
                          uploadResult?.data?.data?.category?.imageUrl ||
                          uploadResult?.data?.category?.imageUrl ||
                          uploadResult?.data?.imageUrl;
          
          if (imageUrl) {
            setCurrentImageUrl(imageUrl);
            // Update finalCategoryData with new imageUrl
            finalCategoryData = {
              ...finalCategoryData,
              imageUrl: imageUrl
            };
          }
          
          message.success(isEditMode ? 'Cập nhật danh mục và ảnh thành công!' : 'Tạo danh mục và upload ảnh thành công!');
        } catch (uploadError) {
          console.error('Upload image error:', uploadError);
          message.warning('Danh mục đã được lưu nhưng upload ảnh thất bại');
        }
      } else {
        message.success(isEditMode ? 'Cập nhật danh mục thành công!' : 'Tạo danh mục thành công!');
      }

      // Call onSuccess with updated category data
      onSuccess?.(finalCategoryData);
      handleCancel();
    } catch (error) {
      console.error('Error saving category:', error);
      message.error(error.response?.data?.message || 'Lưu danh mục thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setCurrentImageUrl('');
    setImageFile(null);
    onCancel?.();
  };

  const handleImageSelect = (file) => {
    setImageFile(file);
    // If file is null (removed), also clear currentImageUrl preview
    if (!file) {
      setCurrentImageUrl('');
    }
  };

  const handleDeleteImage = async () => {
    if (!isEditMode || !category?._id) return;
    
    try {
      await CategoryApi.deleteImage(category._id);
      setCurrentImageUrl('');
      message.success('Xóa ảnh thành công');
      
      // Refresh category data after deletion
      try {
        const updatedResult = await CategoryApi.getById(category._id);
        onSuccess?.(updatedResult.data || updatedResult);
      } catch (error) {
        console.error('Error fetching updated category:', error);
      }
    } catch (error) {
      console.error('Delete image error:', error);
      message.error('Xóa ảnh thất bại');
    }
  };

  // Handle parent category change - inherit componentType
  const handleParentChange = (parentId) => {
    if (parentId) {
      const parentCategory = categories.find(cat => cat._id === parentId);
      if (parentCategory?.componentType) {
        form.setFieldsValue({ componentType: parentCategory.componentType });
      }
    } else {
      // Clear componentType when removing parent
      form.setFieldsValue({ componentType: undefined });
    }
  };

  // Convert categories to tree structure for TreeSelect
  const buildTreeData = (cats, parentId = null) => {
    return cats
      .filter(cat => (cat.parentId === parentId) || (!cat.parentId && !parentId))
      .map(cat => ({
        title: cat.name,
        value: cat._id,
        key: cat._id,
        children: buildTreeData(cats, cat._id)
      }));
  };

  const parentTreeData = buildTreeData(parentCategories);

  return (
          <Modal
        title={isEditMode ? 'Chỉnh sửa danh mục' : 'Tạo danh mục'}
        open={visible}
        onCancel={handleCancel}
        footer={null}
        width={800}
        destroyOnHidden
      >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        scrollToFirstError
      >
        <Row gutter={24}>
          {/* Basic Information */}
          <Col span={12}>
            <Card title="Thông tin cơ bản" size="small">
              <Form.Item
                name="name"
                label="Tên danh mục"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên danh mục!' },
                  { min: 2, message: 'Tên phải có ít nhất 2 ký tự!' }
                ]}
              >
                <Input placeholder="Nhập tên danh mục" />
              </Form.Item>

              <Form.Item name="description" label="Mô tả">
                <TextArea 
                  rows={3} 
                  placeholder="Mô tả danh mục (không bắt buộc)"
                  maxLength={1000}
                />
              </Form.Item>

              <Form.Item name="componentType" label="Loại linh kiện" className={!!form.getFieldValue('parentId') ? 'hidden' : ''}>
                <Select 
                  placeholder="Chọn loại linh kiện (sẽ kế thừa từ danh mục cha nếu có)"
                  allowClear
                  disabled={!!form.getFieldValue('parentId')}
                >
                  {componentTypes.map(type => (
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                </Select>
                {form.getFieldValue('parentId') && (() => {
                  const parentId = form.getFieldValue('parentId');
                  const parentCategory = categories.find(cat => cat._id === parentId);
                  return parentCategory?.componentType ? (
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                      Đã kế thừa từ danh mục cha: <strong>{parentCategory.componentType}</strong>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      Danh mục cha chưa có loại linh kiện
                    </div>
                  );
                })()}
              </Form.Item>

              {/* Category Image Upload */}
              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                  Ảnh danh mục
                </label>
                
                
                <ImageUpload
                  onImageSelect={handleImageSelect}
                  currentImage={currentImageUrl}
                  multiple={false}
                  maxSize={5}
                  placeholder="Chọn ảnh danh mục"
                  showPreview={true}
                  className="category-image-upload"
                  hideIconWhenEmpty={true}
                />
              </div>
            </Card>
          </Col>

          {/* Hierarchy & Settings */}
          <Col span={12}>
            <Card title="Phân cấp & Cài đặt" size="small">
              <Form.Item name="parentId" label="Danh mục cha">
                <TreeSelect
                  style={{ width: '100%' }}
                  styles={{
                    popup: {
                      root: { maxHeight: 400, overflow: 'auto' }
                    }
                  }}
                  treeData={parentTreeData}
                  placeholder="Chọn danh mục cha (không bắt buộc)"
                  allowClear
                  treeDefaultExpandAll
                  onChange={handleParentChange}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="sortOrder" label="Thứ tự sắp xếp">
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="0"
                      min={0}
                      max={9999}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
                    <Switch 
                      checkedChildren="Kích hoạt" 
                      unCheckedChildren="Ngừng"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <div style={{ 
                padding: 12, 
                background: '#f5f5f5', 
                borderRadius: 4, 
                fontSize: 12, 
                color: '#666',
                marginTop: 16
              }}>
                <strong>Quy tắc phân cấp:</strong>
                <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                  <li>Danh mục gốc: Cấp 0 (không có cha)</li>
                  <li>Danh mục con: Cấp 1 (cha là gốc)</li>
                  <li>Danh mục cháu: Cấp 2 (cha là danh mục con)</li>
                  <li>Tối đa 3 cấp được phép</li>
                </ul>
              </div>
            </Card>
          </Col>
        </Row>

        {/* SEO Settings */}
        <Card title="Cài đặt SEO" style={{ marginTop: 16 }} size="small">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="metaTitle" label="Tiêu đề SEO">
                <Input 
                  placeholder="Tiêu đề SEO (mặc định là tên danh mục)"
                  maxLength={60}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="metaKeywords" label="Từ khóa SEO">
                <Input 
                  placeholder="từ khóa1, từ khóa2, từ khóa3"
                  help="Từ khóa phân tách bằng dấu phẩy"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="metaDescription" label="Mô tả SEO">
            <TextArea 
              rows={3} 
              placeholder="Mô tả cho SEO"
              maxLength={160}
            />
          </Form.Item>
        </Card>

        {/* Form Actions */}
        <div style={{ textAlign: 'right', marginTop: 24 }}>
          <Space>
            <Button onClick={handleCancel}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEditMode ? 'Cập nhật danh mục' : 'Tạo danh mục'}
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

export default CategoryFormModal;
