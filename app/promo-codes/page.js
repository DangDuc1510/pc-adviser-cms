"use client";

import { useState } from "react";
import {
  Card,
  Table,
  Button,
  Typography,
  Tag,
  Space,
  Input,
  Select,
  Pagination,
  message,
  Popconfirm,
  Tooltip,
  Flex,
  Row,
  Col,
  DatePicker,
  Switch,
  Badge,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  GiftOutlined,
  UserOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PromoCodeApi } from "@/apis/orders";
import PromoCodeFormModal from "@/components/promo-codes/PromoCodeFormModal";
import { getCurrentUser, hasRole } from "@/utils/permissions";
import dayjs from "dayjs";

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const PromoCodesPage = () => {
  const queryClient = useQueryClient();
  const currentUser = getCurrentUser();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({
    search: "",
    type: null,
    isActive: null,
    dateRange: null,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingPromoCode, setEditingPromoCode] = useState(null);

  // Only employee and admin can manage promo codes
  const canManagePromoCodes = hasRole(currentUser, ["employee", "admin"]);

  // Query for promo codes
  const { data: promoCodesData, isLoading: loading } = useQuery({
    queryKey: ["promoCodes", page, pageSize, filters],
    queryFn: async () => {
      const params = {
        page,
        limit: pageSize,
        ...filters,
      };

      if (filters.dateRange && filters.dateRange.length === 2) {
        params.startDate = filters.dateRange[0].toISOString();
        params.endDate = filters.dateRange[1].toISOString();
      }

      // Remove empty filters
      Object.keys(params).forEach((key) => {
        if (
          params[key] === "" ||
          params[key] === null ||
          (Array.isArray(params[key]) && params[key].length === 0)
        ) {
          delete params[key];
        }
      });

      const response = await PromoCodeApi.getAll(params);
      return {
        promoCodes: response.data || [],
        total: response.pagination?.total || 0,
      };
    },
  });

  const promoCodes = promoCodesData?.promoCodes || [];
  const total = promoCodesData?.total || 0;

  const handleCreatePromoCode = () => {
    setEditingPromoCode(null);
    setFormModalVisible(true);
  };

  const handleEditPromoCode = (promoCode) => {
    setEditingPromoCode(promoCode);
    setFormModalVisible(true);
  };

  const handleFormSuccess = () => {
    setFormModalVisible(false);
    setEditingPromoCode(null);
    queryClient.invalidateQueries({ queryKey: ["promoCodes"] });
  };

  const handleFormCancel = () => {
    setFormModalVisible(false);
    setEditingPromoCode(null);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      type: null,
      isActive: null,
      dateRange: null,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    setPage(1);
  };

  const handleDeletePromoCode = async (promoCode) => {
    try {
      await PromoCodeApi.delete(promoCode._id);
      message.success("Xóa mã khuyến mãi thành công");
      queryClient.invalidateQueries({ queryKey: ["promoCodes"] });
    } catch (error) {
      message.error("Xóa mã khuyến mãi thất bại");
      console.error("Error deleting promo code:", error);
    }
  };

  const handleToggleActive = async (promoCode) => {
    try {
      await PromoCodeApi.toggleActive(promoCode._id);
      message.success(
        `Mã khuyến mãi ${
          promoCode.isActive ? "đã ngừng kích hoạt" : "đã kích hoạt"
        } thành công`
      );
      queryClient.invalidateQueries({ queryKey: ["promoCodes"] });
    } catch (error) {
      message.error("Cập nhật trạng thái mã khuyến mãi thất bại");
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getTypeTag = (type) => {
    const typeConfig = {
      public: { color: "green", icon: <GiftOutlined />, label: "Công khai" },
      "user-specific": {
        color: "blue",
        icon: <UserOutlined />,
        label: "Cho người dùng",
      },
      internal: { color: "orange", icon: <LockOutlined />, label: "Nội bộ" },
    };

    const config = typeConfig[type] || { color: "default", label: type };
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.label}
      </Tag>
    );
  };

  const getStatusTag = (promoCode) => {
    const now = new Date();
    const isExpired = new Date(promoCode.endDate) < now;
    const isNotStarted = new Date(promoCode.startDate) > now;
    const isUsageLimitReached =
      promoCode.usageLimit && promoCode.usageCount >= promoCode.usageLimit;

    if (!promoCode.isActive) {
      return <Tag color="red">Ngừng hoạt động</Tag>;
    }

    if (isExpired) {
      return <Tag color="red">Đã hết hạn</Tag>;
    }

    if (isNotStarted) {
      return <Tag color="orange">Chưa bắt đầu</Tag>;
    }

    if (isUsageLimitReached) {
      return <Tag color="red">Hết lượt sử dụng</Tag>;
    }

    return (
      <Tag color="green" icon={<CheckCircleOutlined />}>
        Đang hoạt động
      </Tag>
    );
  };

  const columns = [
    {
      title: "Mã khuyến mãi",
      dataIndex: "code",
      key: "code",
      width: 150,
      render: (text) => (
        <span
          style={{ fontWeight: 600, fontFamily: "monospace", fontSize: 14 }}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      width: 200,
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (type) => getTypeTag(type),
    },
    {
      title: "Giảm giá",
      key: "discount",
      width: 150,
      render: (_, record) => {
        if (record.discountType === "percentage") {
          return (
            <div>
              <Tag color="blue">{record.discountValue}%</Tag>
              {record.maxDiscountAmount && (
                <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>
                  Tối đa: {formatPrice(record.maxDiscountAmount)}
                </div>
              )}
            </div>
          );
        } else {
          return <Tag color="green">{formatPrice(record.discountValue)}</Tag>;
        }
      },
    },
    {
      title: "Đơn tối thiểu",
      key: "minPurchaseAmount",
      width: 120,
      render: (_, record) => (
        <span>
          {record.minPurchaseAmount > 0
            ? formatPrice(record.minPurchaseAmount)
            : "Không"}
        </span>
      ),
    },
    {
      title: "Sử dụng",
      key: "usage",
      width: 120,
      render: (_, record) => (
        <div>
          <div>
            {record.usageCount || 0} / {record.usageLimit || "∞"}
          </div>
          {record.usageLimitPerUser && (
            <div style={{ fontSize: 11, color: "#999" }}>
              {record.usageLimitPerUser}/người
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Thời hạn",
      key: "validity",
      width: 200,
      render: (_, record) => (
        <div style={{ fontSize: 12 }}>
          <div>Từ: {dayjs(record.startDate).format("DD/MM/YYYY HH:mm")}</div>
          <div>Đến: {dayjs(record.endDate).format("DD/MM/YYYY HH:mm")}</div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 120,
      render: (_, record) => getStatusTag(record),
    },
    ...(canManagePromoCodes
      ? [
          {
            title: "Thao tác",
            key: "actions",
            width: 150,
            render: (_, record) => (
              <Space size={0}>
                <Tooltip title="Chỉnh sửa mã khuyến mãi">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEditPromoCode(record)}
                  />
                </Tooltip>

                <Tooltip
                  title={record.isActive ? "Ngừng kích hoạt" : "Kích hoạt"}
                >
                  <Button
                    type="text"
                    size="small"
                    icon={
                      record.isActive ? (
                        <CheckCircleOutlined />
                      ) : (
                        <CloseCircleOutlined />
                      )
                    }
                    style={{ color: record.isActive ? "#52c41a" : "#f5222d" }}
                    onClick={() => handleToggleActive(record)}
                  />
                </Tooltip>

                <Tooltip title="Xóa mã khuyến mãi">
                  <Popconfirm
                    title={`Xóa mã "${record.code}"?`}
                    description="Bạn có chắc chắn muốn xóa mã khuyến mãi này? Hành động này không thể hoàn tác."
                    onConfirm={() => handleDeletePromoCode(record)}
                    okText="Có"
                    cancelText="Không"
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      danger
                    />
                  </Popconfirm>
                </Tooltip>
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          Quản lý mã khuyến mãi
        </Title>
        <Tooltip title="Tạo mã khuyến mãi mới">
          {canManagePromoCodes && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreatePromoCode}
            >
              Thêm mã khuyến mãi
            </Button>
          )}
        </Tooltip>
      </Flex>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={6}>
            <Tooltip title="Tìm kiếm theo mã hoặc tên">
              <Input
                placeholder="Tìm kiếm mã khuyến mãi..."
                prefix={<SearchOutlined />}
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                allowClear
              />
            </Tooltip>
          </Col>
          <Col span={4}>
            <Tooltip title="Lọc theo loại mã khuyến mãi">
              <Select
                placeholder="Loại mã"
                value={filters.type}
                onChange={(value) => handleFilterChange("type", value)}
                allowClear
                style={{ width: "100%" }}
              >
                <Option value="public">Công khai</Option>
                <Option value="user-specific">Cho người dùng</Option>
                <Option value="internal">Nội bộ</Option>
              </Select>
            </Tooltip>
          </Col>
          <Col span={4}>
            <Tooltip title="Lọc theo trạng thái">
              <Select
                placeholder="Trạng thái"
                value={filters.isActive}
                onChange={(value) => handleFilterChange("isActive", value)}
                allowClear
                style={{ width: "100%" }}
              >
                <Option value={true}>Đang hoạt động</Option>
                <Option value={false}>Ngừng hoạt động</Option>
              </Select>
            </Tooltip>
          </Col>
          <Col span={6}>
            <Tooltip title="Lọc theo khoảng thời gian">
              <RangePicker
                style={{ width: "100%" }}
                value={filters.dateRange}
                onChange={(dates) => handleFilterChange("dateRange", dates)}
                format="DD/MM/YYYY"
                placeholder={["Từ ngày", "Đến ngày"]}
              />
            </Tooltip>
          </Col>
          <Col span={4}>
            <Tooltip title="Xóa tất cả bộ lọc">
              <Button
                icon={<FilterOutlined />}
                onClick={handleClearFilters}
                block
              >
                Xóa bộ lọc
              </Button>
            </Tooltip>
          </Col>
        </Row>
      </Card>

      {/* Promo Codes Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={promoCodes}
          loading={loading}
          rowKey="_id"
          pagination={false}
          scroll={{ x: 1200 }}
        />

        {/* Pagination */}
        <Flex justify="center" style={{ marginTop: 16 }}>
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} của ${total} mã khuyến mãi`
            }
            onChange={(newPage, newPageSize) => {
              setPage(newPage);
              setPageSize(newPageSize);
            }}
          />
        </Flex>
      </Card>

      {/* Promo Code Form Modal */}
      <PromoCodeFormModal
        visible={formModalVisible}
        onCancel={handleFormCancel}
        onSuccess={handleFormSuccess}
        promoCode={editingPromoCode}
      />
    </div>
  );
};

export default PromoCodesPage;
