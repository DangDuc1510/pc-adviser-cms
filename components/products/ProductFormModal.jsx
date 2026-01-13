'use client';

import React, { useState, useEffect } from 'react';
import styles from '@/styles/ProductFormModal.module.css';
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
  Divider,
  message,
  Tag,
  Space,
  Button,
  Upload,
  Progress,
  Tooltip,
  Spin,
  Collapse
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  TagOutlined,
  EyeOutlined,
  StarOutlined,
  StarFilled,
  DragOutlined,
  UploadOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { ProductApi, CategoryApi, BrandApi } from '@/apis/products';
import BrandSelect from '@/components/products/BrandSelect';
import CategorySelect from '@/components/products/CategorySelect';
import { getAllAttributesForCategory } from '@/config/categoryAttributes';
import { getColorOptions, PRODUCT_COLORS } from '@/config/productColors';

const { Option } = Select;
const { TextArea } = Input;

const ProductFormModal = ({ 
  visible, 
  onCancel, 
  onSuccess, 
  product = null, // null for create, object for edit
  categories = [],
  brands = []
}) => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [imageList, setImageList] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [specifications, setSpecifications] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [discountType, setDiscountType] = useState('amount'); // 'amount' or 'percentage'
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [fixedAttributes, setFixedAttributes] = useState({});
  const [fixedAttributesConfig, setFixedAttributesConfig] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);

  const isEditMode = !!product;

  useEffect(() => {
    if (visible) {
      if (isEditMode) {
        // Populate form with existing product data
        form.setFieldsValue({
          name: product.name,
          sku: product.sku,
          shortDescription: product.shortDescription,
          fullDescription: product.fullDescription,
          brandId: product.brandId?._id,
          categoryId: product.categoryId?._id,
          originalPrice: product.pricing?.originalPrice,
          salePrice: product.pricing?.salePrice,
          isOnSale: product.pricing?.isOnSale,
          stock: product.inventory?.stock,
          lowStockThreshold: product.inventory?.lowStockThreshold,
          status: product.status,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          metaTitle: product.seo?.metaTitle,
          metaDescription: product.seo?.metaDescription,
          metaKeywords: product.seo?.metaKeywords?.join(', '),
        });

        // Set existing images
        if (product.images) {
          setImageList(product.images);
        }

        // Set category and load fixed attributes
        const categoryId = product.categoryId?._id || product.categoryId;
        setSelectedCategoryId(categoryId);
        
        // Load fixed attributes config based on componentType
        if (product.categoryId?.componentType) {
          const config = getAllAttributesForCategory(product.categoryId.componentType);
          setFixedAttributesConfig(config);
          
          // Load fixed attributes from product specifications
          const fixedAttrs = {};
          config.forEach(attr => {
            const value = product.specifications?.[attr.key];
            // Handle different types of values
            if (attr.type === 'array') {
              // For array type, always set array (even if empty)
              if (Array.isArray(value)) {
                fixedAttrs[attr.key] = value;
              } else {
                fixedAttrs[attr.key] = [];
              }
            } else if (attr.type === 'boolean') {
              // For boolean type, always set boolean value
              fixedAttrs[attr.key] = value !== undefined && value !== null ? Boolean(value) : false;
            } else {
              // For other types (text, number, textarea, select), set value or empty string
              if (value !== undefined && value !== null && value !== '') {
                fixedAttrs[attr.key] = value;
              } else {
                fixedAttrs[attr.key] = '';
              }
            }
          });
          setFixedAttributes(fixedAttrs);
        }

        // Set dynamic specifications (customSpecs only)
        if (product.specifications?.customSpecs) {
          setSpecifications(product.specifications.customSpecs);
        } else {
          setSpecifications([]);
        }

        // Set colors
        if (product.colors && Array.isArray(product.colors)) {
          setSelectedColors(product.colors);
        } else {
          setSelectedColors([]);
        }

        // Set tags
        if (product.tags) {
          setTags(product.tags);
        }

        // Calculate discount type and percentage if product is on sale
        if (product.pricing?.isOnSale && product.pricing?.originalPrice && product.pricing?.salePrice) {
          const originalPrice = product.pricing.originalPrice;
          const salePrice = product.pricing.salePrice;
          const discount = originalPrice - salePrice;
          const percentage = Math.round((discount / originalPrice) * 100);
          
          // If the calculated percentage results in the same sale price, assume it's percentage-based
          const calculatedSalePrice = originalPrice - (originalPrice * percentage / 100);
          if (Math.abs(calculatedSalePrice - salePrice) <= 1) { // Allow 1 VND difference due to rounding
            setDiscountType('percentage');
            setDiscountPercentage(percentage);
          } else {
            setDiscountType('amount');
            setDiscountPercentage(0);
          }
        } else {
          setDiscountType('amount');
          setDiscountPercentage(0);
        }
      } else {
        // Reset form for create mode
        form.resetFields();
        setImageList([]);
        setSpecifications([]);
        setTags([]);
        setSelectedCategoryId(null);
        setFixedAttributes({});
        setFixedAttributesConfig([]);
        setSelectedColors([]);
      }
    }
  }, [visible, product, isEditMode, form]);

  // Handle category change to load fixed attributes
  useEffect(() => {
    if (selectedCategoryId && categories.length > 0) {
      const selectedCategory = categories.find(cat => cat._id === selectedCategoryId);
      if (selectedCategory?.componentType) {
        const config = getAllAttributesForCategory(selectedCategory.componentType);
        setFixedAttributesConfig(config);
        
        // In edit mode with same category, load data from product specifications
        if (isEditMode && product?.categoryId?._id === selectedCategoryId && product?.specifications) {
          const fixedAttrs = {};
          config.forEach(attr => {
            const value = product.specifications[attr.key];
            if (value !== undefined && value !== null) {
              if (attr.type === 'array' && Array.isArray(value)) {
                fixedAttrs[attr.key] = value;
              } else if (attr.type === 'boolean') {
                fixedAttrs[attr.key] = Boolean(value);
              } else {
                fixedAttrs[attr.key] = value;
              }
            } else {
              // Initialize default values for missing fields
              if (attr.type === 'array') {
                fixedAttrs[attr.key] = [];
              } else if (attr.type === 'boolean') {
                fixedAttrs[attr.key] = false;
              } else {
                fixedAttrs[attr.key] = '';
              }
            }
          });
          setFixedAttributes(fixedAttrs);
        } else if (!isEditMode || !product?.categoryId?._id || product.categoryId._id !== selectedCategoryId) {
          // Reset fixed attributes when category changes (except in edit mode with existing data)
          const initialAttrs = {};
          config.forEach(attr => {
            if (attr.type === 'array') {
              initialAttrs[attr.key] = [];
            } else if (attr.type === 'boolean') {
              initialAttrs[attr.key] = false;
            } else {
              initialAttrs[attr.key] = '';
            }
          });
          setFixedAttributes(initialAttrs);
        }
      } else {
        setFixedAttributesConfig([]);
        setFixedAttributes({});
      }
    } else {
      setFixedAttributesConfig([]);
      setFixedAttributes({});
    }
  }, [selectedCategoryId, categories, isEditMode, product]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      // Process specifications: combine fixed attributes and dynamic customSpecs
      const processedSpecs = {};
      
      // Add fixed attributes
      Object.keys(fixedAttributes).forEach(key => {
        const value = fixedAttributes[key];
        // Include all values: arrays (even empty), booleans, and non-empty strings/numbers
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            // Always include arrays, even if empty
            processedSpecs[key] = value;
          } else if (typeof value === 'boolean') {
            // Always include booleans
            processedSpecs[key] = value;
          } else if (value !== '') {
            // Include non-empty strings/numbers
            processedSpecs[key] = value;
          }
        }
      });
      
      // Add dynamic custom specifications
      const customSpecs = specifications
        .filter(spec => spec.name && spec.value)
        .map(spec => ({ name: spec.name, value: spec.value }));
      
      if (customSpecs.length > 0) {
        processedSpecs.customSpecs = customSpecs;
      }

      // Process images - combine existing and new images
      const allImages = [...imageList, ...newImages.filter(img => img.status === 'done')];
      const processedImages = allImages.map((img, index) => ({
        url: img.url || img.response?.url,
        alt: img.alt || img.name || values.name,
        isPrimary: img.isPrimary || index === 0,
        sortOrder: index
      }));

      const productData = {
        name: values.name,
        sku: values.sku,
        shortDescription: values.shortDescription,
        fullDescription: values.fullDescription,
        brandId: values.brandId,
        categoryId: values.categoryId,
        pricing: {
          originalPrice: values.originalPrice,
          salePrice: values.salePrice,
          isOnSale: values.isOnSale || false,
          currency: 'VND'
        },
        inventory: {
          stock: values.stock || 0,
          lowStockThreshold: values.lowStockThreshold || 10,
          isInStock: (values.stock || 0) > 0
        },
        images: processedImages,
        specifications: processedSpecs,
        colors: selectedColors,
        tags: tags,
        status: values.status || 'draft',
        isActive: values.isActive !== false,
        isFeatured: values.isFeatured || false,
        seo: {
          metaTitle: values.metaTitle || values.name,
          metaDescription: values.metaDescription,
          metaKeywords: values.metaKeywords ? values.metaKeywords.split(',').map(k => k.trim()) : []
        }
      };

      let response;
      let result;
      if (isEditMode) {
        result = await ProductApi.update(product._id, productData);
      } else {
        result = await ProductApi.create(productData);
      }

      // Upload new images if any
      const filesToUpload = newImages.filter(img => img.file && img.status === 'done');
      if (filesToUpload.length > 0 && result.data?._id) {
        try {
          const formData = new FormData();
          filesToUpload.forEach(img => {
            formData.append('images', img.file);
          });
          
          await ProductApi.uploadImages(result.data._id, formData);
          messageApi.success(isEditMode ? 'Cập nhật sản phẩm và ảnh thành công!' : 'Tạo sản phẩm và upload ảnh thành công!');
        } catch (uploadError) {
          console.error('Upload images error:', uploadError);
          messageApi.warning('Sản phẩm đã được lưu nhưng upload ảnh thất bại');
        }
      } else {
        messageApi.success(isEditMode ? 'Cập nhật sản phẩm thành công!' : 'Tạo sản phẩm thành công!');
      }

      onSuccess?.(result.data);
      handleCancel();
    } catch (error) {
      console.error('Error saving product:', error);
      messageApi.error(error.response?.data?.message || 'Lưu sản phẩm thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
          form.resetFields();
      setImageList([]);
      setNewImages([]);
      setSpecifications([]);
      setTags([]);
      setTagInput('');
      setUploadProgress({});
      setPreviewVisible(false);
      setPreviewImage('');
      setPreviewTitle('');
      setImageUploading(false);
      setDragOverIndex(null);
      setDiscountType('amount');
      setDiscountPercentage(0);
      setSelectedCategoryId(null);
      setFixedAttributes({});
      setFixedAttributesConfig([]);
      setSelectedColors([]);
      onCancel?.();
  };

  // Enhanced image upload handling
  const handleImageUpload = async (options) => {
    const { file, onProgress, onSuccess, onError } = options;
    
    try {
      setImageUploading(true);
      
      // Validate file
      const isValidType = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp';
      if (!isValidType) {
        messageApi.error('Chỉ chấp nhận file JPG, PNG, WEBP!');
        onError(new Error('Invalid file type'));
        return;
      }
      
      const isValidSize = file.size / 1024 / 1024 < 10; // 10MB
      if (!isValidSize) {
        messageApi.error('Kích thước file không được vượt quá 10MB!');
        onError(new Error('File too large'));
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage = {
          uid: file.uid,
          name: file.name,
          status: 'uploading',
          url: e.target.result,
          file: file,
          isNew: true,
          isPrimary: imageList.length === 0 && newImages.length === 0
        };
        
        setNewImages(prev => [...prev, newImage]);
        
        // Simulate upload progress
        let progress = 0;
        const timer = setInterval(() => {
          progress += 20;
          onProgress({ percent: progress });
          setUploadProgress(prev => ({ ...prev, [file.uid]: progress }));
          
          if (progress >= 100) {
            clearInterval(timer);
            onSuccess();
            setNewImages(prev => prev.map(img => 
              img.uid === file.uid ? { ...img, status: 'done' } : img
            ));
            setUploadProgress(prev => ({ ...prev, [file.uid]: 100 }));
          }
        }, 200);
      };
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('Upload error:', error);
      onError(error);
    } finally {
      setImageUploading(false);
    }
  };

  const handleExistingImageDelete = async (index) => {
    if (!isEditMode || !product?._id) return;
    
    try {
      await ProductApi.deleteImage(product._id, index);
      const updatedImages = imageList.filter((_, i) => i !== index);
      setImageList(updatedImages);
      messageApi.success('Xóa ảnh thành công');
    } catch (error) {
      console.error('Delete image error:', error);
      messageApi.error('Xóa ảnh thất bại');
    }
  };

  const handleNewImageDelete = (uid) => {
    setNewImages(prev => prev.filter(img => img.uid !== uid));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[uid];
      return newProgress;
    });
  };

  const handleSetPrimaryImage = async (index, isNewImage = false) => {
    if (isNewImage) {
      // Set primary for new images
      setNewImages(prev => prev.map((img, i) => ({
        ...img,
        isPrimary: i === index
      })));
      // Remove primary from existing images
      setImageList(prev => prev.map(img => ({
        ...img,
        isPrimary: false
      })));
    } else {
      if (!isEditMode || !product?._id) {
        // For new product, just update local state
        setImageList(prev => prev.map((img, i) => ({
          ...img,
          isPrimary: i === index
        })));
        // Remove primary from new images
        setNewImages(prev => prev.map(img => ({
          ...img,
          isPrimary: false
        })));
        return;
      }
    
    try {
      await ProductApi.setPrimaryImage(product._id, index);
      const updatedImages = imageList.map((img, i) => ({
        ...img,
        isPrimary: i === index
      }));
      setImageList(updatedImages);
        // Remove primary from new images
        setNewImages(prev => prev.map(img => ({
          ...img,
          isPrimary: false
        })));
      messageApi.success('Đặt ảnh chính thành công');
    } catch (error) {
      console.error('Set primary image error:', error);
      messageApi.error('Đặt ảnh chính thất bại');
    }
    }
  };

  const handleImagePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj || file.file);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewTitle(file.name || file.url?.substring(file.url.lastIndexOf('/') + 1));
    setPreviewVisible(true);
  };

  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Drag and drop reordering
  const handleDragStart = (e, index, isNewImage = false) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ index, isNewImage }));
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, targetIndex, targetIsNewImage = false) => {
    e.preventDefault();
    setDragOverIndex(null);
    
    const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
    const { index: sourceIndex, isNewImage: sourceIsNewImage } = dragData;
    
    if (sourceIndex === targetIndex && sourceIsNewImage === targetIsNewImage) return;
    
    // Handle reordering logic here
    if (sourceIsNewImage && targetIsNewImage) {
      // Reorder within new images
      const newArray = [...newImages];
      const draggedItem = newArray.splice(sourceIndex, 1)[0];
      newArray.splice(targetIndex, 0, draggedItem);
      setNewImages(newArray);
    } else if (!sourceIsNewImage && !targetIsNewImage) {
      // Reorder within existing images
      const newArray = [...imageList];
      const draggedItem = newArray.splice(sourceIndex, 1)[0];
      newArray.splice(targetIndex, 0, draggedItem);
      setImageList(newArray);
    }
    // Cross-list reordering could be implemented here if needed
  };

  // Handle discount calculations
  const handleDiscountTypeChange = (type) => {
    setDiscountType(type);
    if (type === 'percentage' && discountPercentage > 0) {
      const originalPrice = form.getFieldValue('originalPrice');
      if (originalPrice) {
        const salePrice = originalPrice - (originalPrice * discountPercentage / 100);
        form.setFieldsValue({ salePrice: Math.round(salePrice) });
      }
    }
  };

  const handleDiscountPercentageChange = (percentage) => {
    setDiscountPercentage(percentage || 0);
    if (discountType === 'percentage' && percentage) {
      const originalPrice = form.getFieldValue('originalPrice');
      if (originalPrice) {
        const salePrice = originalPrice - (originalPrice * percentage / 100);
        form.setFieldsValue({ salePrice: Math.round(salePrice) });
      }
    }
  };

  const handleOriginalPriceChange = (price) => {
    if (discountType === 'percentage' && discountPercentage > 0 && price) {
      const salePrice = price - (price * discountPercentage / 100);
      form.setFieldsValue({ salePrice: Math.round(salePrice) });
    }
  };

  const addSpecification = () => {
    setSpecifications([...specifications, { name: '', value: '' }]);
  };

  const updateSpecification = (index, field, value) => {
    const newSpecs = [...specifications];
    newSpecs[index][field] = value;
    setSpecifications(newSpecs);
  };

  const removeSpecification = (index) => {
    const newSpecs = specifications.filter((_, i) => i !== index);
    setSpecifications(newSpecs);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.find(tag => tag.name === tagInput.trim())) {
      setTags([...tags, { 
        name: tagInput.trim(), 
        color: '#007bff', 
        priority: 0 
      }]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag.name !== tagToRemove.name));
  };

  // Handle fixed attribute changes
  const updateFixedAttribute = (key, value) => {
    setFixedAttributes(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle array attribute changes (add item)
  const addArrayAttributeItem = (key) => {
    const currentValue = fixedAttributes[key] || [];
    updateFixedAttribute(key, [...currentValue, '']);
  };

  // Handle array attribute changes (update item)
  const updateArrayAttributeItem = (key, index, value) => {
    const currentValue = fixedAttributes[key] || [];
    const newValue = [...currentValue];
    newValue[index] = value;
    updateFixedAttribute(key, newValue);
  };

  // Handle array attribute changes (remove item)
  const removeArrayAttributeItem = (key, index) => {
    const currentValue = fixedAttributes[key] || [];
    const newValue = currentValue.filter((_, i) => i !== index);
    updateFixedAttribute(key, newValue);
  };



  return (
    <>
      {contextHolder}
      <Modal
        title={isEditMode ? 'Chỉnh sửa sản phẩm' : 'Tạo sản phẩm'}
        open={visible}
        onCancel={handleCancel}
        footer={null}
        width={1000}
        destroyOnHidden
      >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        scrollToFirstError
        onValuesChange={(changedValues, allValues) => {
          if (changedValues.categoryId !== undefined) {
            setSelectedCategoryId(changedValues.categoryId);
          }
        }}
      >
        <Row gutter={24}>
          {/* Basic Information */}
          <Col span={12}>
            <Card title="Thông tin cơ bản" size="small">
              <Form.Item
                name="name"
                label="Tên sản phẩm"
                rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm!' }]}
              >
                <Input placeholder="Nhập tên sản phẩm" />
              </Form.Item>

              <Form.Item
                name="sku"
                label="SKU"
                help="Để trống để tự động tạo"
              >
                <Input placeholder="SKU sản phẩm (không bắt buộc)" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="brandId"
                    label="Thương hiệu"
                    rules={[{ required: true, message: 'Vui lòng chọn thương hiệu!' }]}
                  >
                    <BrandSelect style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="categoryId"
                    label="Danh mục"
                    rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}
                  >
                    <CategorySelect 
                      style={{ width: '100%' }}
                      onChange={(value) => {
                        setSelectedCategoryId(value);
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="shortDescription" label="Mô tả ngắn">
                <TextArea rows={3} placeholder="Mô tả ngắn gọn về sản phẩm" />
              </Form.Item>

              <Form.Item name="fullDescription" label="Mô tả chi tiết">
                <TextArea rows={5} placeholder="Mô tả chi tiết sản phẩm" />
              </Form.Item>

              <Form.Item label="Màu sắc">
                <Select
                  mode="multiple"
                  placeholder="Chọn màu sắc sản phẩm"
                  value={selectedColors}
                  onChange={setSelectedColors}
                  style={{ width: '100%' }}
                  options={getColorOptions()}
                  optionRender={(option) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div 
                        style={{ 
                          width: 20, 
                          height: 20, 
                          backgroundColor: option.data.color.hex, 
                          border: '1px solid #d9d9d9',
                          borderRadius: 4,
                          flexShrink: 0
                        }} 
                      />
                      <span>{option.data.color.name}</span>
                    </div>
                  )}
                />
                <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                  Có thể chọn nhiều màu nếu sản phẩm có nhiều phiên bản màu
                </div>
              </Form.Item>
            </Card>
          </Col>

          {/* Pricing & Inventory */}
          <Col span={12}>
            <Card title="Giá và Tồn kho" size="small">
              <Form.Item
                name="originalPrice"
                label="Giá gốc (VND)"
                rules={[{ required: true, message: 'Vui lòng nhập giá gốc!' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="0"
                  min={0}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  onChange={handleOriginalPriceChange}
                />
              </Form.Item>

              <Form.Item name="isOnSale" valuePropName="checked">
                <Switch checkedChildren="Đang giảm giá" unCheckedChildren="Giá thường" />
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) =>
                  prevValues.isOnSale !== currentValues.isOnSale
                }
              >
                {({ getFieldValue }) =>
                  getFieldValue('isOnSale') ? (
                    <div>
                      {/* Discount Type Selection */}
                      <Form.Item label="Loại giảm giá">
                        <Select
                          value={discountType}
                          onChange={handleDiscountTypeChange}
                          style={{ width: '100%' }}
                        >
                          <Option value="amount">Nhập giá trực tiếp</Option>
                          <Option value="percentage">Giảm theo phần trăm (%)</Option>
                        </Select>
                      </Form.Item>

                      {discountType === 'percentage' ? (
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item
                              label="Phần trăm giảm (%)"
                              rules={[{ required: true, message: 'Vui lòng nhập phần trăm giảm!' }]}
                            >
                              <InputNumber
                                style={{ width: '100%' }}
                                placeholder="0"
                                min={0}
                                max={99}
                                value={discountPercentage}
                                onChange={handleDiscountPercentageChange}
                                formatter={value => `${value}%`}
                                parser={value => value.replace('%', '')}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              name="salePrice"
                              label="Giá sau giảm (VND)"
                              rules={[{ required: true, message: 'Vui lòng tính giá sau giảm!' }]}
                            >
                              <InputNumber
                                style={{ width: '100%' }}
                                placeholder="Tự động tính"
                                min={0}
                                disabled
                                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value.replace(/\$\s?|(,*)/g, '')}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      ) : (
                    <Form.Item
                      name="salePrice"
                      label="Giá khuyến mãi (VND)"
                      rules={[{ required: true, message: 'Vui lòng nhập giá khuyến mãi!' }]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        placeholder="0"
                        min={0}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                      />
                    </Form.Item>
                      )}

                      {/* Discount Preview */}
                      {discountType === 'percentage' && discountPercentage > 0 && getFieldValue('originalPrice') && (
                        <div style={{
                          background: '#f6ffed',
                          border: '1px solid #b7eb8f',
                          borderRadius: 6,
                          padding: 12,
                          marginBottom: 16
                        }}>
                          <div style={{ fontSize: 12, color: '#52c41a' }}>
                            <strong>Xem trước giảm giá:</strong>
                          </div>
                          <div style={{ fontSize: 14, marginTop: 4 }}>
                            <span style={{ textDecoration: 'line-through', color: '#999' }}>
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
                                .format(getFieldValue('originalPrice'))}
                            </span>
                            <span style={{ margin: '0 8px', color: '#52c41a', fontWeight: 'bold' }}>
                              -{discountPercentage}%
                            </span>
                            <span style={{ color: '#f5222d', fontWeight: 'bold' }}>
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
                                .format(getFieldValue('originalPrice') - (getFieldValue('originalPrice') * discountPercentage / 100))}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null
                }
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="stock" label="Số lượng tồn">
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="0"
                      min={0}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="lowStockThreshold" label="Ngưỡng cảnh báo tồn kho">
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="10"
                      min={0}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="status" label="Trạng thái" initialValue="draft">
                    <Select>
                      <Option value="draft">Nháp</Option>
                      <Option value="published">Đã xuất bản</Option>
                      <Option value="discontinued">Ngừng kinh doanh</Option>
                      <Option value="coming-soon">Sắp ra mắt</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                    <Form.Item name="isActive" valuePropName="checked">
                      <Switch checkedChildren="Kích hoạt" unCheckedChildren="Ngừng" />
                    </Form.Item>
                    <Form.Item name="isFeatured" valuePropName="checked">
                      <Switch checkedChildren="Nổi bật" unCheckedChildren="Thông thường" />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* Enhanced Images Section */}
        <Collapse 
          defaultActiveKey={['images']} 
          style={{ marginTop: 16 }}
          size="small"
          items={[
            {
              key: 'images',
              label: (
                <Space>
                  <span>Hình ảnh sản phẩm</span>
                  {(imageList.length + newImages.length) > 0 && (
                    <Tag color="blue">
                      {imageList.length + newImages.length} ảnh
                    </Tag>
                  )}
                  {imageUploading && (
                    <Tag color="orange">
                      <Spin size="small" style={{ marginRight: 4 }} />
                      Đang tải...
                    </Tag>
                  )}
                </Space>
              ),
              extra: (
                <Space>
                  <Button 
                    type="dashed" 
                    icon={<ReloadOutlined />} 
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent collapse toggle
                      setImageList([]);
                      setNewImages([]);
                      setUploadProgress({});
                      messageApi.success('Đã reset tất cả ảnh');
                    }}
                    size="small"
                    danger
                  >
                    Reset
                  </Button>
                </Space>
              ),
              children: (
                <div>
                  {/* Current Images */}
          {isEditMode && imageList.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ marginBottom: 16 }}>Ảnh hiện tại:</h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: 16 
              }}>
                {imageList.map((image, index) => (
                  <div
                    key={`existing-${index}`}
                    style={{
                      position: 'relative',
                      border: dragOverIndex === `existing-${index}` ? '2px dashed #1890ff' : '1px solid #d9d9d9',
                      borderRadius: 8,
                      overflow: 'hidden',
                      backgroundColor: '#fafafa'
                    }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index, false)}
                    onDragOver={(e) => handleDragOver(e, `existing-${index}`)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index, false)}
                  >
                    <div style={{ position: 'relative', paddingTop: '100%' }}>
                      <img
                        src={image.url}
                        alt={image.alt || 'Product'}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      
                      {/* Primary Badge */}
                      {image.isPrimary && (
                        <div style={{
                          position: 'absolute',
                          top: 4,
                          left: 4,
                          backgroundColor: '#52c41a',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 'bold'
                        }}>
                          Chính
            </div>
          )}
          
                      {/* Drag Handle */}
                      <div style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        cursor: 'move',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        borderRadius: 4,
                        padding: 2,
                        color: 'white'
                      }}>
                        <DragOutlined />
                      </div>

                      {/* Action Buttons */}
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 8,
                        padding: 4
                      }}>
                        <Tooltip title="Xem ảnh">
                          <Button
                            type="text"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => handleImagePreview(image)}
                            style={{ color: 'white' }}
                          />
                        </Tooltip>
                        
                        <Tooltip title={image.isPrimary ? "Ảnh chính" : "Đặt làm ảnh chính"}>
                          <Button
                            type="text"
                            size="small"
                            icon={image.isPrimary ? <StarFilled /> : <StarOutlined />}
                            onClick={() => handleSetPrimaryImage(index, false)}
                            style={{ color: image.isPrimary ? '#faad14' : 'white' }}
                          />
                        </Tooltip>

                        <Tooltip title="Xóa ảnh">
                          <Button
                            type="text"
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => handleExistingImageDelete(index)}
                            style={{ color: '#ff4d4f' }}
                          />
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* New Images */}
          {newImages.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ marginBottom: 16 }}>
                {isEditMode ? 'Ảnh mới:' : 'Ảnh sản phẩm:'}
                <span style={{ 
                  marginLeft: 8, 
                  fontSize: 12, 
                  color: '#666',
                  fontWeight: 'normal' 
                }}>
                  ({newImages.length} ảnh)
                </span>
              </h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: 16 
              }}>
                {newImages.map((image, index) => (
                  <div
                    key={`new-${image.uid}`}
                    style={{
                      position: 'relative',
                      border: dragOverIndex === `new-${index}` ? '2px dashed #1890ff' : '1px solid #d9d9d9',
                      borderRadius: 8,
                      overflow: 'hidden',
                      backgroundColor: '#fafafa'
                    }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index, true)}
                    onDragOver={(e) => handleDragOver(e, `new-${index}`)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index, true)}
                  >
                    <div style={{ position: 'relative', paddingTop: '100%' }}>
                      <img
                        src={image.url}
                        alt={image.name}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          opacity: image.status === 'uploading' ? 0.7 : 1
                        }}
                      />

                      {/* Upload Progress */}
                      {image.status === 'uploading' && uploadProgress[image.uid] && (
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          borderRadius: 4,
                          padding: 8,
                          minWidth: 60
                        }}>
                          <Progress 
                            type="circle" 
                            percent={uploadProgress[image.uid]} 
                            size={40}
                            strokeColor={{
                              '0%': '#108ee9',
                              '100%': '#87d068',
                            }}
                          />
                        </div>
                      )}
                      
                      {/* Primary Badge */}
                      {image.isPrimary && (
                        <div style={{
                          position: 'absolute',
                          top: 4,
                          left: 4,
                          backgroundColor: '#52c41a',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 'bold'
                        }}>
                          Chính
                        </div>
                      )}

                      {/* Drag Handle */}
                      <div style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        cursor: 'move',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        borderRadius: 4,
                        padding: 2,
                        color: 'white'
                      }}>
                        <DragOutlined />
                      </div>

                      {/* Action Buttons */}
                      {image.status !== 'uploading' && (
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          display: 'flex',
                          justifyContent: 'center',
                          gap: 8,
                          padding: 4
                        }}>
                          <Tooltip title="Xem ảnh">
                            <Button
                              type="text"
                              size="small"
                              icon={<EyeOutlined />}
                              onClick={() => handleImagePreview(image)}
                              style={{ color: 'white' }}
                            />
                          </Tooltip>
                          
                          <Tooltip title={image.isPrimary ? "Ảnh chính" : "Đặt làm ảnh chính"}>
                            <Button
                              type="text"
                              size="small"
                              icon={image.isPrimary ? <StarFilled /> : <StarOutlined />}
                              onClick={() => handleSetPrimaryImage(index, true)}
                              style={{ color: image.isPrimary ? '#faad14' : 'white' }}
                            />
                          </Tooltip>

                          <Tooltip title="Xóa ảnh">
                            <Button
                              type="text"
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => handleNewImageDelete(image.uid)}
                              style={{ color: '#ff4d4f' }}
                            />
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Area */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <Upload.Dragger
              multiple
              accept="image/*"
              customRequest={handleImageUpload}
              showUploadList={false}
              style={{ 
                background: '#fafafa',
                border: '2px dashed #d9d9d9',
                borderRadius: 8
              }}
            >
              <div style={{ padding: '20px 0' }}>
                <p className="ant-upload-drag-icon">
                  <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                </p>
                <p className="ant-upload-text" style={{ fontSize: 16, marginBottom: 8 }}>
                  Kéo thả ảnh vào đây hoặc click để chọn
                </p>
                <p className="ant-upload-hint" style={{ color: '#666' }}>
                  Hỗ trợ JPG, PNG, WEBP. Kích thước tối đa 10MB mỗi ảnh.
                  <br />
                  Có thể chọn nhiều ảnh cùng lúc.
                </p>
              </div>
            </Upload.Dragger>
          </div>

          {/* Upload Tips */}
          <div style={{ 
            backgroundColor: '#f6ffed', 
            border: '1px solid #b7eb8f',
            borderRadius: 6,
            padding: 12,
            fontSize: 12,
            color: '#389e0d'
          }}>
            <strong>💡 Mẹo:</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: 16 }}>
              <li>Ảnh đầu tiên sẽ tự động được đặt làm ảnh chính</li>
              <li>Kéo thả để sắp xếp lại thứ tự ảnh</li>
              <li>Click vào ⭐ để đặt ảnh chính</li>
              <li>Nên có ít nhất 3-5 ảnh cho sản phẩm</li>
            </ul>
          </div>
                </div>
              )
            },
            {
              key: 'specifications',
              label: (
                <Space>
                  <span>Thông số kỹ thuật</span>
                  {fixedAttributesConfig.length > 0 && (
                    <Tag color="blue">{fixedAttributesConfig.length} thông số cố định</Tag>
                  )}
                </Space>
              ),
              extra: (
                <Button 
                  type="dashed" 
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent collapse toggle
                    addSpecification();
                  }} 
                  icon={<PlusOutlined />}
                  size="small"
                >
                  Thêm thông số động
                </Button>
              ),
              children: (
                <div>
                  {/* Fixed Attributes Section */}
                  {fixedAttributesConfig.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <Divider orientation="left" style={{ marginTop: 0 }}>
                        <Tag color="blue">Thông số cố định theo loại sản phẩm</Tag>
                      </Divider>
                      <Row gutter={[16, 16]}>
                        {fixedAttributesConfig.map((attr) => {
                          // Check if this attribute depends on another attribute
                          if (attr.dependsOn) {
                            const dependsOnValue = fixedAttributes[attr.dependsOn];
                            // Only show if the dependency is true (for boolean) or truthy
                            if (!dependsOnValue) {
                              return null;
                            }
                          }

                          return (
                            <Col span={12} key={attr.key}>
                              {attr.type === 'array' && attr.options ? (
                                <div>
                                  <div style={{ marginBottom: 8, fontWeight: 500 }}>
                                    {attr.label}
                                    {attr.required && <span style={{ color: 'red' }}> *</span>}
                                  </div>
                                  <Select
                                    mode="multiple"
                                    style={{ width: '100%' }}
                                    placeholder={attr.placeholder}
                                    value={fixedAttributes[attr.key] || []}
                                    onChange={(value) => updateFixedAttribute(attr.key, value)}
                                    allowClear
                                    dropdownStyle={{ minWidth: 300 }}
                                  >
                                    {attr.options?.map((option) => (
                                      <Option key={option.value} value={option.value}>
                                        {option.label}
                                      </Option>
                                    ))}
                                  </Select>
                                </div>
                              ) : attr.type === 'array' ? (
                                <div>
                                  <div style={{ marginBottom: 8, fontWeight: 500 }}>
                                    {attr.label}
                                    {attr.required && <span style={{ color: 'red' }}> *</span>}
                                  </div>
                                  {(fixedAttributes[attr.key] || []).map((item, index) => (
                                    <Row key={index} gutter={8} style={{ marginBottom: 8 }}>
                                      <Col span={20}>
                                        <Input
                                          placeholder={attr.placeholder}
                                          value={item}
                                          onChange={(e) => updateArrayAttributeItem(attr.key, index, e.target.value)}
                                        />
                                      </Col>
                                      <Col span={4}>
                                        <Button
                                          type="text"
                                          danger
                                          icon={<DeleteOutlined />}
                                          onClick={() => removeArrayAttributeItem(attr.key, index)}
                                        />
                                      </Col>
                                    </Row>
                                  ))}
                                  <Button
                                    type="dashed"
                                    size="small"
                                    icon={<PlusOutlined />}
                                    onClick={() => addArrayAttributeItem(attr.key)}
                                    style={{ width: '100%', marginTop: 8 }}
                                  >
                                    Thêm {attr.label}
                                  </Button>
                                </div>
                              ) : attr.type === 'number' ? (
                                <div>
                                  <div style={{ marginBottom: 8, fontWeight: 500 }}>
                                    {attr.label}
                                    {attr.required && <span style={{ color: 'red' }}> *</span>}
                                  </div>
                                  <InputNumber
                                    style={{ width: '100%' }}
                                    placeholder={attr.placeholder}
                                    value={fixedAttributes[attr.key] || undefined}
                                    onChange={(value) => updateFixedAttribute(attr.key, value)}
                                  />
                                </div>
                              ) : attr.type === 'boolean' ? (
                                <div>
                                  <div style={{ marginBottom: 8, fontWeight: 500 }}>
                                    {attr.label}
                                    {attr.required && <span style={{ color: 'red' }}> *</span>}
                                  </div>
                                  <Switch
                                    checked={fixedAttributes[attr.key] || false}
                                    onChange={(checked) => {
                                      updateFixedAttribute(attr.key, checked);
                                      // If unchecking hasLED, also reset ledType
                                      if (attr.key === 'hasLED' && !checked) {
                                        updateFixedAttribute('ledType', 'none');
                                      }
                                    }}
                                    checkedChildren="Có"
                                    unCheckedChildren="Không"
                                  />
                                </div>
                              ) : attr.type === 'select' ? (
                                <div>
                                  <div style={{ marginBottom: 8, fontWeight: 500 }}>
                                    {attr.label}
                                    {attr.required && <span style={{ color: 'red' }}> *</span>}
                                  </div>
                                  <Select
                                    style={{ width: '100%' }}
                                    placeholder={attr.placeholder}
                                    value={fixedAttributes[attr.key] || undefined}
                                    onChange={(value) => updateFixedAttribute(attr.key, value)}
                                    allowClear
                                    dropdownStyle={{ minWidth: 300 }}
                                  >
                                    {attr.options?.map((option) => (
                                      <Option key={option.value} value={option.value}>
                                        {option.label}
                                      </Option>
                                    ))}
                                  </Select>
                                </div>
                              ) : attr.type === 'textarea' ? (
                                <div>
                                  <div style={{ marginBottom: 8, fontWeight: 500 }}>
                                    {attr.label}
                                    {attr.required && <span style={{ color: 'red' }}> *</span>}
                                  </div>
                                  <TextArea
                                    rows={4}
                                    placeholder={attr.placeholder}
                                    value={fixedAttributes[attr.key] || ''}
                                    onChange={(e) => updateFixedAttribute(attr.key, e.target.value)}
                                  />
                                </div>
                              ) : (
                                <div>
                                  <div style={{ marginBottom: 8, fontWeight: 500 }}>
                                    {attr.label}
                                    {attr.required && <span style={{ color: 'red' }}> *</span>}
                                  </div>
                                  <Input
                                    placeholder={attr.placeholder}
                                    value={fixedAttributes[attr.key] || ''}
                                    onChange={(e) => updateFixedAttribute(attr.key, e.target.value)}
                                  />
                                </div>
                              )}
                            </Col>
                          );
                        })}
                      </Row>
                    </div>
                  )}

                  {/* Dynamic Attributes Section */}
                  <div>
                    {fixedAttributesConfig.length > 0 && (
                      <Divider orientation="left">
                        <Tag color="green">Thông số động (tùy chỉnh)</Tag>
                      </Divider>
                    )}
                    {specifications.length === 0 && fixedAttributesConfig.length === 0 && (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '20px',
                        color: '#999',
                        backgroundColor: '#fafafa',
                        borderRadius: 4
                      }}>
                        Chọn danh mục để hiển thị thông số cố định hoặc thêm thông số động
                      </div>
                    )}
                    {specifications.map((spec, index) => (
                      <Row key={index} gutter={16} style={{ marginBottom: 8 }}>
                        <Col span={8}>
                          <Input
                            placeholder="Tên thông số"
                            value={spec.name}
                            onChange={(e) => updateSpecification(index, 'name', e.target.value)}
                          />
                        </Col>
                        <Col span={12}>
                          <Input
                            placeholder="Giá trị thông số"
                            value={spec.value}
                            onChange={(e) => updateSpecification(index, 'value', e.target.value)}
                          />
                        </Col>
                        <Col span={4}>
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => removeSpecification(index)}
                          />
                        </Col>
                      </Row>
                    ))}
                  </div>
                </div>
              )
            },
            {
              key: 'tags',
              label: 'Thẻ',
              children: (
                <div>
                  <Space wrap style={{ marginBottom: 16 }}>
                    {tags.map((tag, index) => (
                      <Tag
                        key={index}
                        closable
                        onClose={() => removeTag(tag)}
                        color={tag.color}
                      >
                        {tag.name}
                      </Tag>
                    ))}
                  </Space>
                  <Row gutter={8}>
                    <Col span={20}>
                      <Input
                        placeholder="Thêm thẻ"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onPressEnter={addTag}
                        prefix={<TagOutlined />}
                      />
                    </Col>
                    <Col span={4}>
                      <Button onClick={addTag} type="dashed" block>
                        Thêm
                      </Button>
                    </Col>
                  </Row>
                </div>
              )
            },
            {
              key: 'seo',
              label: 'Cài đặt SEO',
              children: (
                <div>
                  <Form.Item name="metaTitle" label="Tiêu đề SEO">
                    <Input placeholder="Tiêu đề SEO (mặc định là tên sản phẩm)" />
                  </Form.Item>

                  <Form.Item name="metaDescription" label="Mô tả SEO">
                    <TextArea rows={3} placeholder="Mô tả cho SEO" />
                  </Form.Item>

                  <Form.Item name="metaKeywords" label="Từ khóa SEO">
                    <Input placeholder="từ khóa1, từ khóa2, từ khóa3" />
                  </Form.Item>
                </div>
              )
            }
          ]}
        />

        {/* Form Actions */}
        <div style={{ textAlign: 'right', marginTop: 24 }}>
          <Space>
            <Button onClick={handleCancel}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEditMode ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm'}
            </Button>
          </Space>
        </div>
      </Form>

      {/* Image Preview Modal */}
      <Modal
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width="80%"
        style={{ maxWidth: 800 }}
        centered
      >
        <div style={{ textAlign: 'center' }}>
          <img 
            alt="preview" 
            style={{ 
              width: '100%',
              maxHeight: '70vh',
              objectFit: 'contain'
            }} 
            src={previewImage} 
          />
        </div>
      </Modal>
    </Modal>
    </>
  );
};

export default ProductFormModal;
