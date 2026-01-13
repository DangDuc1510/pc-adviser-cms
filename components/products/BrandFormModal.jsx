'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Switch,
  Card,
  Row,
  Col,
  message,
  Space,
  Button,
  Avatar
} from 'antd';
import {
  PlusOutlined,
  LoadingOutlined,
  GlobalOutlined,
  ShopOutlined
} from '@ant-design/icons';
import { BrandApi } from '@/apis/products';
import ImageUpload from '@/components/common/ImageUpload';

const { TextArea } = Input;

const BrandFormModal = ({ 
  visible, 
  onCancel, 
  onSuccess, 
  brand = null // null for create, object for edit
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState('');

  const isEditMode = !!brand;

  useEffect(() => {
    if (visible) {
      if (isEditMode) {
        // Populate form with existing brand data
        form.setFieldsValue({
          name: brand.name,
          description: brand.description,
          country: brand.country,
          isActive: brand.isActive,
          metaTitle: brand.metaTitle,
          metaDescription: brand.metaDescription,
          metaKeywords: brand.metaKeywords?.join(', '),
        });
        setCurrentLogoUrl(brand.logoUrl || '');
      } else {
        // Reset form for create mode
        form.resetFields();
        form.setFieldsValue({
          isActive: true
        });
        setCurrentLogoUrl('');
      }
    }
  }, [visible, brand, isEditMode, form]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const brandData = {
        name: values.name,
        description: values.description,
        country: values.country,
        isActive: values.isActive !== false,
        metaTitle: values.metaTitle || values.name,
        metaDescription: values.metaDescription,
        metaKeywords: values.metaKeywords 
          ? values.metaKeywords.split(',').map(k => k.trim()).filter(k => k) 
          : []
      };

      let result;
      if (isEditMode) {
        result = await BrandApi.update(brand._id, brandData);
      } else {
        result = await BrandApi.create(brandData);
      }

      // Upload logo if new file selected
      if (logoFile && result.data?._id) {
        try {
          const formData = new FormData();
          formData.append('logo', logoFile);
          
          await BrandApi.uploadLogo(result.data._id, formData);
          message.success(isEditMode ? 'Cập nhật thương hiệu và logo thành công!' : 'Tạo thương hiệu và upload logo thành công!');
        } catch (uploadError) {
          console.error('Upload logo error:', uploadError);
          message.warning('Thương hiệu đã được lưu nhưng upload logo thất bại');
        }
      } else {
        message.success(isEditMode ? 'Cập nhật thương hiệu thành công!' : 'Tạo thương hiệu thành công!');
      }

      onSuccess?.(result.data);
      handleCancel();
    } catch (error) {
      console.error('Error saving brand:', error);
      message.error(error.response?.data?.message || 'Lưu thương hiệu thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setCurrentLogoUrl('');
    setLogoFile(null);
    onCancel?.();
  };

  const handleLogoSelect = (file) => {
    setLogoFile(file);
  };

  const handleDeleteLogo = async () => {
    if (!isEditMode || !brand?._id) return;
    
    try {
      await BrandApi.deleteLogo(brand._id);
      setCurrentLogoUrl('');
      message.success('Xóa logo thành công');
    } catch (error) {
      console.error('Delete logo error:', error);
      message.error('Xóa logo thất bại');
    }
  };


  return (
          <Modal
        title={isEditMode ? 'Chỉnh sửa thương hiệu' : 'Tạo thương hiệu'}
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
          <Col span={16}>
            <Card title="Thông tin cơ bản" size="small">
              <Form.Item
                name="name"
                label="Tên thương hiệu"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên thương hiệu!' },
                  { min: 1, message: 'Tên không được để trống!' },
                  { max: 100, message: 'Tên quá dài!' }
                ]}
              >
                <Input 
                  placeholder="Nhập tên thương hiệu"
                  prefix={<ShopOutlined style={{ color: '#999' }} />}
                />
              </Form.Item>

              <Form.Item name="description" label="Mô tả">
                <TextArea 
                  rows={4} 
                  placeholder="Mô tả thương hiệu (không bắt buộc)"
                  maxLength={2000}
                  showCount
                />
              </Form.Item>

              <Form.Item name="country" label="Quốc gia">
                <Input 
                  placeholder="ví dụ: Việt Nam, Hoa Kỳ, Nhật Bản"
                  maxLength={100}
                />
              </Form.Item>
            </Card>
          </Col>

          {/* Logo & Status */}
          <Col span={8}>
            <Card title="Logo & Trạng thái" size="small">
              {isEditMode && currentLogoUrl && (
                <div style={{ marginBottom: 16, textAlign: 'center' }}>
                  <div style={{ marginBottom: 8 }}>Logo hiện tại:</div>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <Avatar
                      src={currentLogoUrl}
                      size={80}
                      shape="square"
                      style={{ backgroundColor: '#f5f5f5' }}
                    />
                    <Button
                      type="text"
                      danger
                      size="small"
                      onClick={handleDeleteLogo}
                      style={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        padding: 0,
                        backgroundColor: 'rgba(255, 77, 79, 0.8)',
                        color: 'white'
                      }}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              )}
              
              <div style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 8, fontSize: '14px', fontWeight: 500 }}>
                  {isEditMode ? 'Thay đổi logo:' : 'Logo:'}
                </div>
                <ImageUpload
                  onImageSelect={handleLogoSelect}
                  currentImage={currentLogoUrl}
                  multiple={false}
                  maxSize={5}
                  placeholder="Chọn logo"
                  showPreview={false}
                  className="brand-logo-upload"
                />
              </div>

              <Form.Item 
                name="isActive" 
                label="Trạng thái" 
                valuePropName="checked"
              >
                <Switch 
                  checkedChildren="Kích hoạt" 
                  unCheckedChildren="Ngừng"
                />
              </Form.Item>

              <div style={{ 
                padding: 12, 
                background: '#f0f2f5', 
                borderRadius: 4, 
                fontSize: 12, 
                color: '#666',
                marginTop: 16
              }}>
                <strong>Hướng dẫn thương hiệu:</strong>
                <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                  <li>Sử dụng tên thương hiệu chính thức</li>
                  <li>Logo vuông chất lượng cao</li>
                  <li>Thông tin quốc gia chính xác</li>
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
                  placeholder="Tiêu đề SEO (mặc định là tên thương hiệu)"
                  maxLength={60}
                  showCount
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
              placeholder="Mô tả SEO cho công cụ tìm kiếm"
              maxLength={160}
              showCount
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
              {isEditMode ? 'Cập nhật thương hiệu' : 'Tạo thương hiệu'}
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

export default BrandFormModal;
