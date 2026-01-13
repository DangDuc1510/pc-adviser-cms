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
  TimePicker,
  Radio,
  Checkbox,
  Steps,
  Alert,
} from "antd";
import {
  InfoCircleOutlined,
  GiftOutlined,
  PlusOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { VoucherRuleApi } from "@/apis/voucherRules";
import { CategoryApi, BrandApi, ProductApi } from "@/apis/products";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

const VoucherRuleFormModal = ({
  visible,
  onCancel,
  onSuccess,
  rule = null,
  initialTriggerType = null,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [triggerType, setTriggerType] = useState(null);
  const [discountType, setDiscountType] = useState("percentage");
  const [applicableTo, setApplicableTo] = useState("all");

  const isEditMode = !!rule;

  // Query for categories, brands, products
  const { data: categoriesData } = useQuery({
    queryKey: ["categories", "voucher-rule-form"],
    queryFn: async () => {
      const response = await CategoryApi.getAll({ isActive: true, limit: 100 });
      return response?.categories || [];
    },
    enabled: visible && applicableTo === "categories",
  });

  const { data: brandsData } = useQuery({
    queryKey: ["brands", "voucher-rule-form"],
    queryFn: async () => {
      const response = await BrandApi.getAll({ isActive: true, limit: 100 });
      return response?.brands || [];
    },
    enabled: visible && applicableTo === "brands",
  });

  const { data: productsData } = useQuery({
    queryKey: ["products", "voucher-rule-form"],
    queryFn: async () => {
      const response = await ProductApi.getAll({ isActive: true, limit: 100 });
      return response?.products || [];
    },
    enabled: visible && applicableTo === "products",
  });

  const categories = categoriesData || [];
  const brands = brandsData || [];
  const products = productsData || [];

  useEffect(() => {
    if (visible) {
      if (isEditMode && rule) {
        form.setFieldsValue({
          name: rule.name,
          description: rule.description,
          isActive: rule.isActive,
          triggerType: rule.triggerType,
          triggerConfig: {
            days: rule.triggerConfig?.days,
            amount: rule.triggerConfig?.amount,
          },
          voucherTemplate: {
            name: rule.voucherTemplate?.name,
            description: rule.voucherTemplate?.description,
            discountType: rule.voucherTemplate?.discountType,
            discountValue: rule.voucherTemplate?.discountValue,
            maxDiscountAmount: rule.voucherTemplate?.maxDiscountAmount,
            minPurchaseAmount: rule.voucherTemplate?.minPurchaseAmount,
            validityDays: rule.voucherTemplate?.validityDays,
            usageLimitPerUser: rule.voucherTemplate?.usageLimitPerUser ?? 1,
            usageLimit: rule.voucherTemplate?.usageLimit ?? 1,
            applicableTo: rule.voucherTemplate?.applicableTo || "all",
            categoryIds:
              rule.voucherTemplate?.categoryIds?.map((id) => id._id || id) ||
              [],
            productIds:
              rule.voucherTemplate?.productIds?.map((id) => id._id || id) || [],
            brandIds:
              rule.voucherTemplate?.brandIds?.map((id) => id._id || id) || [],
          },
        });
        setTriggerType(rule.triggerType);
        setDiscountType(rule.voucherTemplate?.discountType || "percentage");
        setApplicableTo(rule.voucherTemplate?.applicableTo || "all");
      } else {
        form.resetFields();
        const defaultTriggerType = initialTriggerType || "user_registered";
        form.setFieldsValue({
          isActive: true,
          triggerType: defaultTriggerType,
          voucherTemplate: {
            discountType: "percentage",
            applicableTo: "all",
            validityDays: 30,
            usageLimitPerUser: 1,
            usageLimit: 1,
          },
          triggerConfig:
            defaultTriggerType === "spending_milestone"
              ? { amount: 20000000 }
              : defaultTriggerType === "inactivity_days"
              ? { days: 30 }
              : {},
        });
        setTriggerType(defaultTriggerType);
        setDiscountType("percentage");
        setApplicableTo("all");
      }
      setCurrentStep(0);
    }
  }, [visible, rule, isEditMode, form]);

  const handleSubmit = async () => {
    try {
      // Validate all fields from all steps before submitting
      // Use array syntax to match form field names
      const allFields = [
        "name",
        "triggerType",
        ["voucherTemplate", "name"],
        ["voucherTemplate", "discountType"],
        ["voucherTemplate", "discountValue"],
        ["voucherTemplate", "validityDays"],
      ];

      // Add conditional fields based on trigger type
      const triggerType = form.getFieldValue("triggerType");
      if (triggerType === "inactivity_days") {
        allFields.push(["triggerConfig", "days"]);
      } else if (triggerType === "spending_milestone") {
        allFields.push(["triggerConfig", "amount"]);
      }

      const values = await form.validateFields(allFields);
      setLoading(true);

      // Get nested values correctly (form uses array syntax)
      const voucherTemplate = values.voucherTemplate || {};
      const triggerConfig = values.triggerConfig || {};

      const ruleData = {
        name: values.name,
        description: values.description,
        isActive: values.isActive !== false,
        triggerType: values.triggerType,
        triggerConfig: {},
        voucherTemplate: {
          name: voucherTemplate.name,
          description: voucherTemplate.description,
          discountType: voucherTemplate.discountType,
          discountValue: voucherTemplate.discountValue,
          maxDiscountAmount: voucherTemplate.maxDiscountAmount,
          minPurchaseAmount: voucherTemplate.minPurchaseAmount || 0,
          validityDays: voucherTemplate.validityDays,
          usageLimitPerUser: voucherTemplate.usageLimitPerUser ?? 1,
          usageLimit: voucherTemplate.usageLimit ?? 1,
          applicableTo: voucherTemplate.applicableTo || "all",
          categoryIds: voucherTemplate.categoryIds || [],
          productIds: voucherTemplate.productIds || [],
          brandIds: voucherTemplate.brandIds || [],
        },
      };

      // Set trigger config based on trigger type
      if (values.triggerType === "inactivity_days") {
        ruleData.triggerConfig.days = triggerConfig.days || 30;
      } else if (values.triggerType === "spending_milestone") {
        ruleData.triggerConfig.amount = triggerConfig.amount || 20000000;
      }

      if (isEditMode) {
        await VoucherRuleApi.update(rule._id, ruleData);
        message.success("Cập nhật quy tắc thành công");
      } else {
        await VoucherRuleApi.create(ruleData);
        message.success("Tạo quy tắc thành công");
      }

      onSuccess();
      form.resetFields();
      setCurrentStep(0);
    } catch (error) {
      console.error("Error saving voucher rule:", error);
      message.error(
        "Lưu quy tắc thất bại: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    try {
      // Validate current step
      const fieldsToValidate = getFieldsForStep(currentStep);
      await form.validateFields(fieldsToValidate);
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error("Validation error:", error);
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const getFieldsForStep = (step) => {
    switch (step) {
      case 0:
        return ["name", "triggerType"];
      case 1:
        return [
          ["voucherTemplate", "name"],
          ["voucherTemplate", "discountType"],
          ["voucherTemplate", "discountValue"],
          ["voucherTemplate", "validityDays"],
        ];
      default:
        return [];
    }
  };

  const steps = [
    {
      title: "Thông tin cơ bản",
      icon: <InfoCircleOutlined />,
    },
    {
      title: "Cấu hình Voucher",
      icon: <GiftOutlined />,
    },
  ];

  return (
    <Modal
      title={
        <Space>
          {isEditMode ? (
            <>
              <EditOutlined />
              <span>Chỉnh sửa Quy tắc</span>
            </>
          ) : (
            <>
              <PlusOutlined />
              <span>Tạo Quy tắc Mới</span>
            </>
          )}
        </Space>
      }
      open={visible}
      onCancel={() => {
        form.resetFields();
        setCurrentStep(0);
        onCancel();
      }}
      width={800}
      footer={null}
      destroyOnClose
    >
      <div className="mx-auto max-w-[600px] pt-6 ">
        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          {steps.map((step, index) => (
            <Step key={index} title={step.title} icon={step.icon} />
          ))}
        </Steps>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {/* Step 0: Basic Information */}
        {currentStep === 0 && (
          <Card title="Thông tin cơ bản">
            <Form.Item
              name="name"
              label="Tên quy tắc"
              rules={[
                { required: true, message: "Vui lòng nhập tên quy tắc!" },
              ]}
            >
              <Input placeholder="Ví dụ: Voucher chào mừng khách hàng mới" />
            </Form.Item>

            <Form.Item name="description" label="Mô tả">
              <TextArea rows={3} placeholder="Mô tả về quy tắc này..." />
            </Form.Item>

            <Form.Item
              name="triggerType"
              label="Loại trigger"
              rules={[
                { required: true, message: "Vui lòng chọn loại trigger!" },
              ]}
            >
              <Select
                placeholder="Chọn loại trigger"
                onChange={(value) => {
                  setTriggerType(value);
                  form.setFieldsValue({
                    triggerConfig: {
                      days: value === "inactivity_days" ? 30 : undefined,
                      amount:
                        value === "spending_milestone" ? 20000000 : undefined,
                    },
                  });
                }}
              >
                <Option value="user_registered">
                  Lần đầu đăng ký tài khoản
                </Option>
                <Option value="spending_milestone">Đạt mốc chi tiêu</Option>
                <Option value="birthday">Sinh nhật</Option>
                <Option value="inactivity_days">Không hoạt động</Option>
              </Select>
            </Form.Item>

            {triggerType === "inactivity_days" && (
              <Form.Item
                name={["triggerConfig", "days"]}
                label="Số ngày không hoạt động"
                rules={[{ required: true, message: "Vui lòng nhập số ngày!" }]}
              >
                <InputNumber
                  min={1}
                  placeholder="Ví dụ: 30"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            )}

            {triggerType === "spending_milestone" && (
              <Form.Item
                name={["triggerConfig", "amount"]}
                label="Mốc chi tiêu (VNĐ)"
                rules={[
                  { required: true, message: "Vui lòng nhập mốc chi tiêu!" },
                ]}
              >
                <InputNumber
                  min={0}
                  placeholder="Ví dụ: 1000000"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            )}

            <Form.Item
              name="isActive"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch checkedChildren="Hoạt động" unCheckedChildren="Tắt" />
            </Form.Item>
          </Card>
        )}

        {/* Step 1: Voucher Template */}
        {currentStep === 1 && (
          <Card title="Cấu hình Voucher Template">
            <Form.Item
              name={["voucherTemplate", "name"]}
              label="Tên voucher"
              rules={[
                { required: true, message: "Vui lòng nhập tên voucher!" },
              ]}
            >
              <Input placeholder="Ví dụ: Voucher chào mừng 20%" />
            </Form.Item>

            <Form.Item
              name={["voucherTemplate", "description"]}
              label="Mô tả voucher"
            >
              <TextArea rows={2} placeholder="Mô tả về voucher..." />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name={["voucherTemplate", "discountType"]}
                  label="Loại giảm giá"
                  rules={[{ required: true }]}
                >
                  <Select onChange={(value) => setDiscountType(value)}>
                    <Option value="percentage">Phần trăm (%)</Option>
                    <Option value="fixed">Số tiền cố định (VNĐ)</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name={["voucherTemplate", "discountValue"]}
                  label={
                    discountType === "percentage"
                      ? "Phần trăm giảm"
                      : "Số tiền giảm"
                  }
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập giá trị giảm giá!",
                    },
                  ]}
                >
                  <InputNumber
                    min={0}
                    max={discountType === "percentage" ? 100 : undefined}
                    placeholder={
                      discountType === "percentage"
                        ? "Ví dụ: 20"
                        : "Ví dụ: 100000"
                    }
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
            </Row>

            {discountType === "percentage" && (
              <Form.Item
                name={["voucherTemplate", "maxDiscountAmount"]}
                label="Giảm tối đa (VNĐ)"
              >
                <InputNumber
                  min={0}
                  placeholder="Ví dụ: 500000"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            )}

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name={["voucherTemplate", "minPurchaseAmount"]}
                  label="Đơn hàng tối thiểu (VNĐ)"
                  initialValue={0}
                >
                  <InputNumber
                    min={0}
                    placeholder="Ví dụ: 1000000"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name={["voucherTemplate", "validityDays"]}
                  label="Số ngày hiệu lực"
                  rules={[
                    { required: true, message: "Vui lòng nhập số ngày!" },
                  ]}
                >
                  <InputNumber
                    min={1}
                    placeholder="Ví dụ: 30"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name={["voucherTemplate", "usageLimitPerUser"]}
                  label="Số lần sử dụng tối đa/user"
                  initialValue={1}
                >
                  <InputNumber
                    min={1}
                    placeholder="Để trống = không giới hạn"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name={["voucherTemplate", "usageLimit"]}
                  label="Tổng số lần sử dụng tối đa"
                  initialValue={1}
                >
                  <InputNumber
                    min={1}
                    placeholder="Để trống = không giới hạn"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name={["voucherTemplate", "applicableTo"]}
              label="Áp dụng cho"
              initialValue="all"
            >
              <Select onChange={(value) => setApplicableTo(value)}>
                <Option value="all">Tất cả sản phẩm</Option>
                <Option value="categories">Danh mục cụ thể</Option>
                <Option value="brands">Thương hiệu cụ thể</Option>
                <Option value="products">Sản phẩm cụ thể</Option>
              </Select>
            </Form.Item>

            {applicableTo === "categories" && (
              <Form.Item
                name={["voucherTemplate", "categoryIds"]}
                label="Chọn danh mục"
              >
                <Select mode="multiple" placeholder="Chọn danh mục">
                  {categories.map((cat) => (
                    <Option key={cat._id} value={cat._id}>
                      {cat.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            {applicableTo === "brands" && (
              <Form.Item
                name={["voucherTemplate", "brandIds"]}
                label="Chọn thương hiệu"
              >
                <Select mode="multiple" placeholder="Chọn thương hiệu">
                  {brands.map((brand) => (
                    <Option key={brand._id} value={brand._id}>
                      {brand.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            {applicableTo === "products" && (
              <Form.Item
                name={["voucherTemplate", "productIds"]}
                label="Chọn sản phẩm"
              >
                <Select mode="multiple" placeholder="Chọn sản phẩm">
                  {products.map((product) => (
                    <Option key={product._id} value={product._id}>
                      {product.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}
          </Card>
        )}

        {/* Removed Step 2: Target Audience */}
        {false && currentStep === 2 && (
          <Card title="Đối tượng Mục tiêu">
            <Form.Item
              name={["targetAudience", "type"]}
              label="Loại đối tượng"
              rules={[{ required: true }]}
            >
              <Radio.Group
                onChange={(e) => setTargetAudienceType(e.target.value)}
              >
                <Space direction="vertical">
                  <Radio value="all">Tất cả người dùng</Radio>
                  <Radio value="segmentation">Theo phân loại khách hàng</Radio>
                  <Radio value="custom" disabled>
                    Tùy chỉnh (Sắp có)
                  </Radio>
                </Space>
              </Radio.Group>
            </Form.Item>

            {targetAudienceType === "segmentation" && (
              <Form.Item
                name={["targetAudience", "segmentationTypes"]}
                label="Chọn loại phân loại"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn ít nhất một loại!",
                  },
                ]}
              >
                <Checkbox.Group>
                  <Space direction="vertical">
                    <Checkbox value="potential">Tiềm năng</Checkbox>
                    <Checkbox value="loyal">Trung thành</Checkbox>
                    <Checkbox value="at_risk">Chuẩn bị rời bỏ</Checkbox>
                    <Checkbox value="churned">Rời bỏ</Checkbox>
                  </Space>
                </Checkbox.Group>
              </Form.Item>
            )}
          </Card>
        )}

        {/* Removed Step 3: Schedule */}
        {false && currentStep === 3 && (
          <Card title="Lịch trình Thực thi">
            <Form.Item
              name={["schedule", "type"]}
              label="Loại lịch trình"
              rules={[{ required: true }]}
            >
              <Radio.Group onChange={(e) => setScheduleType(e.target.value)}>
                <Space direction="vertical">
                  <Radio value="realtime">
                    Real-time (Ngay khi trigger xảy ra)
                  </Radio>
                  <Radio value="daily">Hàng ngày</Radio>
                  <Radio value="weekly">Hàng tuần</Radio>
                </Space>
              </Radio.Group>
            </Form.Item>

            {scheduleType === "daily" && (
              <Form.Item
                name={["schedule", "time"]}
                label="Thời gian chạy"
                rules={[
                  { required: true, message: "Vui lòng chọn thời gian!" },
                ]}
              >
                <TimePicker
                  format="HH:mm"
                  placeholder="Chọn thời gian"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            )}

            {scheduleType === "weekly" && (
              <>
                <Form.Item
                  name={["schedule", "dayOfWeek"]}
                  label="Ngày trong tuần"
                  rules={[{ required: true, message: "Vui lòng chọn ngày!" }]}
                >
                  <Select placeholder="Chọn ngày">
                    <Option value={0}>Chủ nhật</Option>
                    <Option value={1}>Thứ 2</Option>
                    <Option value={2}>Thứ 3</Option>
                    <Option value={3}>Thứ 4</Option>
                    <Option value={4}>Thứ 5</Option>
                    <Option value={5}>Thứ 6</Option>
                    <Option value={6}>Thứ 7</Option>
                  </Select>
                </Form.Item>
                <Form.Item
                  name={["schedule", "time"]}
                  label="Thời gian chạy"
                  rules={[
                    { required: true, message: "Vui lòng chọn thời gian!" },
                  ]}
                >
                  <TimePicker
                    format="HH:mm"
                    placeholder="Chọn thời gian"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </>
            )}

            {scheduleType === "realtime" && (
              <Alert
                message="Real-time"
                description="Voucher sẽ được phát ngay khi trigger xảy ra (ví dụ: ngay khi user đăng ký, ngay khi đến sinh nhật)"
                type="info"
                showIcon
              />
            )}
          </Card>
        )}

        {/* Removed Step 4: Limits */}
        {false && currentStep === 4 && (
          <Card title="Giới hạn Phân phối">
            <Form.Item
              name="maxDistributions"
              label="Tổng số voucher tối đa"
              tooltip="Để trống = không giới hạn"
            >
              <InputNumber
                min={1}
                placeholder="Ví dụ: 1000"
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Form.Item
              name="maxPerUser"
              label="Số voucher tối đa cho mỗi user"
              tooltip="Để trống = không giới hạn"
            >
              <InputNumber
                min={1}
                placeholder="Ví dụ: 1"
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Alert
              message="Lưu ý"
              description="Các giới hạn này giúp kiểm soát chi phí và đảm bảo không phát quá nhiều voucher."
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          </Card>
        )}

        <Divider />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 24,
          }}
        >
          <Button onClick={handlePrev} disabled={currentStep === 0}>
            Quay lại
          </Button>
          <Space>
            <Button
              onClick={() => {
                form.resetFields();
                setCurrentStep(0);
                onCancel();
              }}
            >
              Hủy
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button type="primary" onClick={handleNext}>
                Tiếp theo
              </Button>
            ) : (
              <Button type="primary" onClick={handleSubmit} loading={loading}>
                {isEditMode ? "Cập nhật" : "Tạo quy tắc"}
              </Button>
            )}
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

export default VoucherRuleFormModal;
