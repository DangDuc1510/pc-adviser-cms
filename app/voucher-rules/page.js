"use client";

import { useState } from "react";
import {
  Card,
  Button,
  Typography,
  Tag,
  Space,
  App,
  Popconfirm,
  Tooltip,
  Table,
  Input,
  Select,
  Switch,
  Badge,
  Flex,
  Pagination,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { VoucherRuleApi } from "@/apis/voucherRules";
import VoucherRuleFormModal from "@/components/vouchers/VoucherRuleFormModal";
import { getCurrentUser, hasRole } from "@/utils/permissions";
import { formatPrice } from "@/utils/format";

const { Title } = Typography;
const { Option } = Select;

const TRIGGER_TYPE_CONFIG = {
  user_registered: {
    label: "Lần đầu đăng ký tài khoản",
    color: "blue",
  },
  spending_milestone: {
    label: "Đạt mốc chi tiêu",
    color: "green",
  },
  birthday: {
    label: "Sinh nhật",
    color: "pink",
  },
  inactivity_days: {
    label: "Không hoạt động",
    color: "orange",
  },
};

const VoucherRulesPage = () => {
  const { message: messageAPI } = App.useApp();
  const queryClient = useQueryClient();
  const currentUser = getCurrentUser();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({
    search: "",
    triggerType: null,
    isActive: null,
  });
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [selectedTriggerType, setSelectedTriggerType] = useState(null);

  const canManageRules = hasRole(currentUser, ["employee", "admin"]);

  // Query for voucher rules
  const { data: rulesData, isLoading: loading } = useQuery({
    queryKey: ["voucherRules", page, pageSize, filters],
    queryFn: async () => {
      const params = {
        page,
        limit: pageSize,
        ...filters,
      };

      Object.keys(params).forEach((key) => {
        if (
          params[key] === "" ||
          params[key] === null ||
          (Array.isArray(params[key]) && params[key].length === 0)
        ) {
          delete params[key];
        }
      });

      const response = await VoucherRuleApi.getAll(params);
      return {
        rules: response.data || [],
        total: response.pagination?.total || 0,
      };
    },
  });

  const rules = rulesData?.rules || [];
  const total = rulesData?.total || 0;

  const handleCreateRule = (triggerType = null) => {
    setSelectedTriggerType(triggerType);
    setEditingRule(null);
    setFormModalVisible(true);
  };

  const handleEditRule = (rule) => {
    setSelectedTriggerType(rule.triggerType);
    setEditingRule(rule);
    setFormModalVisible(true);
  };

  const handleFormSuccess = () => {
    setFormModalVisible(false);
    setEditingRule(null);
    setSelectedTriggerType(null);
    queryClient.invalidateQueries(["voucherRules"]);
    messageAPI.success("Lưu quy tắc thành công");
  };

  const handleFormCancel = () => {
    setFormModalVisible(false);
    setEditingRule(null);
    setSelectedTriggerType(null);
  };

  const handleDeleteRule = async (rule) => {
    try {
      await VoucherRuleApi.delete(rule._id);
      messageAPI.success("Xóa quy tắc thành công");
      queryClient.invalidateQueries(["voucherRules"]);
    } catch (error) {
      messageAPI.error("Xóa quy tắc thất bại: " + (error.message || "Lỗi không xác định"));
    }
  };

  const handleToggleActive = async (rule) => {
    try {
      await VoucherRuleApi.toggle(rule._id);
      messageAPI.success(`Đã ${rule.isActive ? "tắt" : "bật"} quy tắc`);
      queryClient.invalidateQueries(["voucherRules"]);
    } catch (error) {
      messageAPI.error("Thao tác thất bại: " + (error.message || "Lỗi không xác định"));
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      triggerType: null,
      isActive: null,
    });
    setPage(1);
  };

  const formatVoucherInfo = (rule) => {
    const template = rule.voucherTemplate;
    if (!template) return "Chưa cấu hình";

    const discountText =
      template.discountType === "percentage"
        ? `${template.discountValue}%`
        : `${formatPrice(template.discountValue)}`;

    const maxDiscount = template.maxDiscountAmount
      ? ` (tối đa ${formatPrice(template.maxDiscountAmount)})`
      : "";

    const minPurchase = template.minPurchaseAmount
      ? ` - Tối thiểu ${formatPrice(template.minPurchaseAmount)}`
      : "";

    return `${discountText}${maxDiscount}${minPurchase} - Hiệu lực ${template.validityDays} ngày`;
  };

  const formatTriggerConfig = (rule) => {
    if (rule.triggerType === "spending_milestone") {
      return `Mốc: ${formatPrice(rule.triggerConfig?.amount || 20000000)}`;
    }
    if (rule.triggerType === "inactivity_days") {
      return `${rule.triggerConfig?.days || 30} ngày`;
    }
    return "Tự động";
  };

  const columns = [
    {
      title: "Tên quy tắc",
      dataIndex: "name",
      key: "name",
      width: 250,
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 500 }}>{text}</span>
          {record.description && (
            <span style={{ fontSize: 12, color: "#8c8c8c" }}>{record.description}</span>
          )}
        </Space>
      ),
    },
    {
      title: "Loại trigger",
      dataIndex: "triggerType",
      key: "triggerType",
      width: 180,
      render: (type) => {
        const config = TRIGGER_TYPE_CONFIG[type] || TRIGGER_TYPE_CONFIG.user_registered;
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: "Cấu hình trigger",
      key: "triggerConfig",
      width: 180,
      render: (_, record) => (
        <span style={{ fontSize: 13 }}>{formatTriggerConfig(record)}</span>
      ),
    },
    {
      title: "Thông tin voucher",
      key: "voucherInfo",
      width: 300,
      render: (_, record) => (
        <span style={{ fontSize: 13 }}>{formatVoucherInfo(record)}</span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      render: (isActive) => (
        <Badge
          status={isActive ? "success" : "default"}
          text={isActive ? "Hoạt động" : "Đã tắt"}
        />
      ),
    },
    ...(canManageRules
      ? [
          {
            title: "Thao tác",
            key: "actions",
            width: 150,
            fixed: "right",
            render: (_, record) => (
              <Space>
                <Tooltip title={record.isActive ? "Tắt" : "Bật"}>
                  <Switch
                    checked={record.isActive}
                    onChange={() => handleToggleActive(record)}
                    size="small"
                  />
                </Tooltip>
                <Tooltip title="Chỉnh sửa">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEditRule(record)}
                  />
                </Tooltip>
                <Popconfirm
                  title={`Xóa quy tắc "${record.name}"?`}
                  description="Bạn có chắc chắn muốn xóa quy tắc này?"
                  onConfirm={() => handleDeleteRule(record)}
                  okText="Có"
                  cancelText="Không"
                >
                  <Tooltip title="Xóa">
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                    />
                  </Tooltip>
                </Popconfirm>
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <div style={{ padding: 24 }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          Quy tắc Phát Voucher
        </Title>
        {canManageRules && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleCreateRule()}
          >
            Thêm quy tắc
          </Button>
        )}
      </Flex>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Tìm kiếm theo tên..."
            prefix={<SearchOutlined />}
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            allowClear
            style={{ width: 250 }}
          />
          <Select
            placeholder="Loại trigger"
            style={{ width: 200 }}
            allowClear
            value={filters.triggerType}
            onChange={(value) => handleFilterChange("triggerType", value)}
          >
            {Object.entries(TRIGGER_TYPE_CONFIG).map(([value, config]) => (
              <Option key={value} value={value}>
                {config.label}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="Trạng thái"
            style={{ width: 150 }}
            allowClear
            value={filters.isActive}
            onChange={(value) => handleFilterChange("isActive", value)}
          >
            <Option value={true}>Hoạt động</Option>
            <Option value={false}>Đã tắt</Option>
          </Select>
          <Button icon={<FilterOutlined />} onClick={handleClearFilters}>
            Xóa bộ lọc
          </Button>
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={rules}
          loading={loading}
          rowKey="_id"
          pagination={false}
          scroll={{ x: 1200 }}
        />

        <Flex justify="center" style={{ marginTop: 16 }}>
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} của ${total} quy tắc`
            }
            onChange={(newPage, newPageSize) => {
              setPage(newPage);
              setPageSize(newPageSize);
            }}
          />
        </Flex>
      </Card>

      <VoucherRuleFormModal
        visible={formModalVisible}
        onCancel={handleFormCancel}
        onSuccess={handleFormSuccess}
        rule={editingRule}
        initialTriggerType={selectedTriggerType}
      />
    </div>
  );
};

export default VoucherRulesPage;
