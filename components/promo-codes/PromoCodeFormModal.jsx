"use client";

import React, { useState, useEffect } from "react";
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
  Space,
  Button,
  Tooltip,
  DatePicker,
  Tag,
  Alert,
} from "antd";
import {
  InfoCircleOutlined,
  UserOutlined,
  GiftOutlined,
} from "@ant-design/icons";
import { PromoCodeApi } from "@/apis/orders";
import { useQuery } from "@tanstack/react-query";
import { UserApi } from "@/apis/auth";
import { CustomerApi } from "@/apis/customer";
import { CategoryApi, BrandApi, ProductApi } from "@/apis/products";
import { SegmentationApi } from "@/apis/segmentation";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

const PromoCodeFormModal = ({
  visible,
  onCancel,
  onSuccess,
  promoCode = null,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [discountType, setDiscountType] = useState("percentage");
  const [applicableTo, setApplicableTo] = useState("all");
  const [promoType, setPromoType] = useState("public");
  const [loadingSegmentUsers, setLoadingSegmentUsers] = useState(false);

  const isEditMode = !!promoCode;

  // Query for customers (for user-specific codes)
  // We get customers and extract userIds from them
  const { data: customersData, isLoading: loadingCustomers } = useQuery({
    queryKey: ["customers", "promo-code-form"],
    queryFn: async () => {
      const response = await CustomerApi.getAll({
        limit: 1000,
        page: 1,
      });
      const customers = response?.customers || response?.data || [];
      // Extract users from customers (only registered customers with userId)
      const users = customers
        .filter((customer) => customer.userId)
        .map((customer) => ({
          _id: customer.userId._id || customer.userId,
          name: customer.userId.userName || customer.userId.email || "Unknown",
          email: customer.userId.email || "",
          userName: customer.userId.userName || "",
        }));
      // Remove duplicates by _id
      const uniqueUsers = Array.from(
        new Map(users.map((user) => [user._id, user])).values()
      );
      return uniqueUsers;
    },
    enabled: visible && promoType === "user-specific",
  });

  const users = customersData || [];

  // Query for categories
  const { data: categoriesData } = useQuery({
    queryKey: ["categories", "promo-code-form"],
    queryFn: async () => {
      const response = await CategoryApi.getAll({ isActive: true, limit: 100 });
      return response?.categories || [];
    },
    enabled: visible && applicableTo === "categories",
  });

  const categories = categoriesData || [];

  // Query for brands
  const { data: brandsData } = useQuery({
    queryKey: ["brands", "promo-code-form"],
    queryFn: async () => {
      const response = await BrandApi.getAll({ isActive: true, limit: 100 });
      return response?.brands || [];
    },
    enabled: visible && applicableTo === "brands",
  });

  const brands = brandsData || [];

  // Query for products
  const { data: productsData } = useQuery({
    queryKey: ["products", "promo-code-form"],
    queryFn: async () => {
      const response = await ProductApi.getAll({ isActive: true, limit: 100 });
      return response?.products || [];
    },
    enabled: visible && applicableTo === "products",
  });

  const products = productsData || [];

  useEffect(() => {
    if (visible) {
      if (isEditMode) {
        // Populate form with existing promo code data
        form.setFieldsValue({
          code: promoCode.code,
          name: promoCode.name,
          description: promoCode.description,
          type: promoCode.type,
          discountType: promoCode.discountType,
          discountValue: promoCode.discountValue,
          maxDiscountAmount: promoCode.maxDiscountAmount,
          minPurchaseAmount: promoCode.minPurchaseAmount,
          usageLimit: promoCode.usageLimit,
          usageLimitPerUser: promoCode.usageLimitPerUser,
          startDate: dayjs(promoCode.startDate),
          endDate: dayjs(promoCode.endDate),
          applicableTo: promoCode.applicableTo || "all",
          categoryIds: promoCode.categoryIds?.map((id) => id._id || id) || [],
          productIds: promoCode.productIds?.map((id) => id._id || id) || [],
          brandIds: promoCode.brandIds?.map((id) => id._id || id) || [],
          userIds: promoCode.userIds?.map((id) => id._id || id) || [],
          isActive: promoCode.isActive,
        });
        setDiscountType(promoCode.discountType);
        setApplicableTo(promoCode.applicableTo || "all");
        setPromoType(promoCode.type);
      } else {
        // Reset form for create mode
        form.resetFields();
        form.setFieldsValue({
          type: "public",
          discountType: "percentage",
          applicableTo: "all",
          isActive: true,
          startDate: dayjs(),
          endDate: dayjs().add(30, "day"),
        });
        setDiscountType("percentage");
        setApplicableTo("all");
        setPromoType("public");
      }
    }
  }, [visible, promoCode, isEditMode, form]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const promoCodeData = {
        code: values.code?.toUpperCase().trim(),
        name: values.name,
        description: values.description,
        type: values.type,
        discountType: values.discountType,
        discountValue: values.discountValue,
        maxDiscountAmount: values.maxDiscountAmount,
        minPurchaseAmount: values.minPurchaseAmount || 0,
        usageLimit: values.usageLimit,
        usageLimitPerUser: values.usageLimitPerUser,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
        applicableTo: values.applicableTo || "all",
        isActive: values.isActive !== false,
      };

      // Add applicable IDs based on applicableTo
      if (values.applicableTo === "categories" && values.categoryIds) {
        promoCodeData.categoryIds = values.categoryIds;
      } else if (values.applicableTo === "products" && values.productIds) {
        promoCodeData.productIds = values.productIds;
      } else if (values.applicableTo === "brands" && values.brandIds) {
        promoCodeData.brandIds = values.brandIds;
      }

      // Add userIds for user-specific codes
      if (values.type === "user-specific" && values.userIds) {
        promoCodeData.userIds = values.userIds;
      }

      let result;
      if (isEditMode) {
        result = await PromoCodeApi.update(promoCode._id, promoCodeData);
      } else {
        result = await PromoCodeApi.create(promoCodeData);
      }

      message.success(
        isEditMode
          ? "Cập nhật mã khuyến mãi thành công!"
          : "Tạo mã khuyến mãi thành công!"
      );
      onSuccess?.(result.data);
      handleCancel();
    } catch (error) {
      console.error("Error saving promo code:", error);
      message.error(
        error.response?.data?.message || "Lưu mã khuyến mãi thất bại"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setDiscountType("percentage");
    setApplicableTo("all");
    setPromoType("public");
    onCancel?.();
  };

  const handleQuickSelectSegment = async (segmentType) => {
    try {
      setLoadingSegmentUsers(true);
      const segmentUsers = await SegmentationApi.getUsersBySegment(segmentType);
      const userIds = segmentUsers.map((user) => user._id);

      if (userIds.length === 0) {
        message.warning(
          `Không tìm thấy người dùng nào trong nhóm "${getSegmentLabel(
            segmentType
          )}"`
        );
        return;
      }

      form.setFieldsValue({ userIds });
      message.success(
        `Đã chọn ${userIds.length} người dùng từ nhóm "${getSegmentLabel(
          segmentType
        )}"`
      );
    } catch (error) {
      console.error("Error loading segment users:", error);
      message.error("Không thể tải danh sách người dùng theo phân loại");
    } finally {
      setLoadingSegmentUsers(false);
    }
  };

  const getSegmentLabel = (type) => {
    const labels = {
      loyal: "Trung thành",
      potential: "Tiềm năng",
      at_risk: "Có nguy cơ",
      churned: "Đã rời bỏ",
    };
    return labels[type] || type;
  };

  return (
    <Modal
      title={isEditMode ? "Chỉnh sửa mã khuyến mãi" : "Tạo mã khuyến mãi"}
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={900}
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
                name="code"
                label="Mã khuyến mãi"
                normalize={(value) =>
                  value ? value.toUpperCase().trim() : value
                }
                rules={[
                  { required: true, message: "Vui lòng nhập mã khuyến mãi!" },
                  {
                    pattern: /^[A-Z0-9_-]+$/,
                    message:
                      "Mã chỉ được chứa chữ cái, số, dấu gạch dưới và dấu gạch ngang",
                  },
                ]}
                tooltip="Mã sẽ tự động chuyển thành chữ hoa"
              >
                <Input
                  placeholder="Ví dụ: SALE2024, WELCOME10"
                  style={{ textTransform: "uppercase" }}
                  disabled={isEditMode}
                />
              </Form.Item>

              <Form.Item
                name="name"
                label="Tên mã khuyến mãi"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập tên mã khuyến mãi!",
                  },
                ]}
              >
                <Input placeholder="Ví dụ: Giảm giá Black Friday" />
              </Form.Item>

              <Form.Item name="description" label="Mô tả">
                <TextArea rows={3} placeholder="Mô tả về mã khuyến mãi" />
              </Form.Item>

              <Form.Item
                name="type"
                label="Loại mã khuyến mãi"
                rules={[{ required: true, message: "Vui lòng chọn loại mã!" }]}
              >
                <Select onChange={(value) => setPromoType(value)}>
                  <Option value="public">
                    <Space>
                      <GiftOutlined />
                      <span>Công khai - Ai cũng có thể sử dụng</span>
                    </Space>
                  </Option>
                  <Option value="user-specific">
                    <Space>
                      <UserOutlined />
                      <span>Cho người dùng - Chỉ người được chỉ định</span>
                    </Space>
                  </Option>
                </Select>
              </Form.Item>

              {promoType === "user-specific" && (
                <>
                  <Form.Item
                    name="userIds"
                    label="Người dùng được phép sử dụng"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn ít nhất một người dùng!",
                      },
                    ]}
                    extra={
                      <div style={{ marginTop: 8 }}>
                        <Space size="small" wrap>
                          <span style={{ fontSize: 12, color: "#666" }}>
                            Chọn nhanh:
                          </span>
                          <Button
                            size="small"
                            type="default"
                            onClick={() => handleQuickSelectSegment("loyal")}
                            loading={loadingSegmentUsers}
                            style={{ fontSize: 12 }}
                          >
                            🟢 Trung thành
                          </Button>
                          <Button
                            size="small"
                            type="default"
                            onClick={() =>
                              handleQuickSelectSegment("potential")
                            }
                            loading={loadingSegmentUsers}
                            style={{ fontSize: 12 }}
                          >
                            🟡 Tiềm năng
                          </Button>
                          <Button
                            size="small"
                            type="default"
                            onClick={() => handleQuickSelectSegment("at_risk")}
                            loading={loadingSegmentUsers}
                            style={{ fontSize: 12 }}
                          >
                            🟠 Có nguy cơ
                          </Button>
                          <Button
                            size="small"
                            type="default"
                            onClick={() => handleQuickSelectSegment("churned")}
                            loading={loadingSegmentUsers}
                            style={{ fontSize: 12 }}
                          >
                            🔴 Đã rời bỏ
                          </Button>
                        </Space>
                      </div>
                    }
                  >
                    <Select
                      mode="multiple"
                      placeholder="Chọn người dùng"
                      showSearch
                      loading={loadingCustomers}
                      filterOption={(input, option) =>
                        option?.children
                          ?.toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      notFoundContent={
                        loadingCustomers
                          ? "Đang tải..."
                          : "Không tìm thấy người dùng"
                      }
                    >
                      {users.map((user) => (
                        <Option key={user._id} value={user._id}>
                          {user.name || user.userName}{" "}
                          {user.email && `(${user.email})`}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </>
              )}
            </Card>
          </Col>

          {/* Discount Configuration */}
          <Col span={12}>
            <Card title="Cấu hình giảm giá" size="small">
              <Form.Item
                name="discountType"
                label="Loại giảm giá"
                rules={[
                  { required: true, message: "Vui lòng chọn loại giảm giá!" },
                ]}
              >
                <Select onChange={(value) => setDiscountType(value)}>
                  <Option value="percentage">Phần trăm (%)</Option>
                  <Option value="fixed">Số tiền cố định (VND)</Option>
                </Select>
              </Form.Item>

              <Row gutter={16}>
                <Col span={discountType === "percentage" ? 12 : 24}>
                  <Form.Item
                    name="discountValue"
                    label={
                      discountType === "percentage"
                        ? "Phần trăm giảm (%)"
                        : "Số tiền giảm (VND)"
                    }
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập giá trị giảm giá!",
                      },
                      {
                        type: "number",
                        min: discountType === "percentage" ? 1 : 1000,
                        max: discountType === "percentage" ? 100 : undefined,
                        message:
                          discountType === "percentage"
                            ? "Phần trăm phải từ 1% đến 100%"
                            : "Số tiền tối thiểu là 1,000 VND",
                      },
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      placeholder={
                        discountType === "percentage" ? "10" : "50000"
                      }
                      min={discountType === "percentage" ? 1 : 1000}
                      max={discountType === "percentage" ? 100 : undefined}
                      formatter={
                        discountType === "percentage"
                          ? (value) => `${value}%`
                          : (value) =>
                              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={
                        discountType === "percentage"
                          ? (value) => value.replace("%", "")
                          : (value) => value.replace(/\$\s?|(,*)/g, "")
                      }
                    />
                  </Form.Item>
                </Col>
                {discountType === "percentage" && (
                  <Col span={12}>
                    <Form.Item
                      name="maxDiscountAmount"
                      label="Giảm tối đa (VND)"
                      tooltip="Giới hạn số tiền giảm tối đa khi dùng phần trăm"
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        placeholder="Không giới hạn"
                        min={0}
                        formatter={(value) =>
                          `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                        }
                        parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                      />
                    </Form.Item>
                  </Col>
                )}
              </Row>

              <Form.Item
                name="minPurchaseAmount"
                label="Đơn hàng tối thiểu (VND)"
                tooltip="Số tiền tối thiểu của đơn hàng để sử dụng mã này"
              >
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="0"
                  min={0}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="usageLimit"
                    label="Giới hạn sử dụng"
                    tooltip="Tổng số lần mã có thể được sử dụng"
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      placeholder="Không giới hạn"
                      min={1}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="usageLimitPerUser"
                    label="Giới hạn/người"
                    tooltip="Số lần mỗi người có thể sử dụng mã này"
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      placeholder="Không giới hạn"
                      min={1}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="isActive"
                valuePropName="checked"
                label="Trạng thái"
              >
                <Switch checkedChildren="Kích hoạt" unCheckedChildren="Ngừng" />
              </Form.Item>
            </Card>
          </Col>
        </Row>

        {/* Validity Period */}
        <Card title="Thời hạn hiệu lực" size="small" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startDate"
                label="Ngày bắt đầu"
                rules={[
                  { required: true, message: "Vui lòng chọn ngày bắt đầu!" },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  showTime
                  format="DD/MM/YYYY HH:mm"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endDate"
                label="Ngày kết thúc"
                rules={[
                  { required: true, message: "Vui lòng chọn ngày kết thúc!" },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  showTime
                  format="DD/MM/YYYY HH:mm"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Applicable To */}
        <Card title="Áp dụng cho" size="small" style={{ marginTop: 16 }}>
          <Form.Item
            name="applicableTo"
            label="Phạm vi áp dụng"
            rules={[{ required: true }]}
          >
            <Select onChange={(value) => setApplicableTo(value)}>
              <Option value="all">Tất cả sản phẩm</Option>
              <Option value="categories">Theo danh mục</Option>
              <Option value="products">Theo sản phẩm cụ thể</Option>
              <Option value="brands">Theo thương hiệu</Option>
            </Select>
          </Form.Item>

          {applicableTo === "categories" && (
            <Form.Item
              name="categoryIds"
              label="Chọn danh mục"
              rules={[
                {
                  required: true,
                  message: "Vui lòng chọn ít nhất một danh mục!",
                },
              ]}
            >
              <Select
                mode="multiple"
                placeholder="Chọn danh mục"
                showSearch
                filterOption={(input, option) =>
                  option?.children?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {categories.map((category) => (
                  <Option key={category._id} value={category._id}>
                    {category.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {applicableTo === "products" && (
            <Form.Item
              name="productIds"
              label="Chọn sản phẩm"
              rules={[
                {
                  required: true,
                  message: "Vui lòng chọn ít nhất một sản phẩm!",
                },
              ]}
            >
              <Select
                mode="multiple"
                placeholder="Chọn sản phẩm"
                showSearch
                filterOption={(input, option) =>
                  option?.children?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {products.map((product) => (
                  <Option key={product._id} value={product._id}>
                    {product.name} ({product.sku})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {applicableTo === "brands" && (
            <Form.Item
              name="brandIds"
              label="Chọn thương hiệu"
              rules={[
                {
                  required: true,
                  message: "Vui lòng chọn ít nhất một thương hiệu!",
                },
              ]}
            >
              <Select
                mode="multiple"
                placeholder="Chọn thương hiệu"
                showSearch
                filterOption={(input, option) =>
                  option?.children?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {brands.map((brand) => (
                  <Option key={brand._id} value={brand._id}>
                    {brand.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}
        </Card>

        {/* Form Actions */}
        <div style={{ textAlign: "right", marginTop: 24 }}>
          <Space>
            <Button onClick={handleCancel}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEditMode ? "Cập nhật mã khuyến mãi" : "Tạo mã khuyến mãi"}
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

export default PromoCodeFormModal;
