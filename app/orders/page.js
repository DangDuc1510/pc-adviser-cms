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
  DatePicker,
  Flex,
  Row,
  Col,
  Statistic,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  CloseOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { OrderApi } from "@/apis/orders";
import OrderDetailModal from "@/components/orders/OrderDetailModal";
import OrderStatusModal from "@/components/orders/OrderStatusModal";
import PermissionWrapper from "@/components/common/PermissionWrapper";
import {
  getCurrentUser,
  hasPermission,
  hasRole,
  PERMISSIONS,
} from "@/utils/permissions";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
} from "@/config/orderConstants";
import dayjs from "dayjs";

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const OrdersPage = () => {
  const queryClient = useQueryClient();
  const currentUser = getCurrentUser();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({
    search: "",
    status: null,
    paymentStatus: null,
    dateRange: null,
  });
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const canManageOrderStatus = hasPermission(
    currentUser,
    PERMISSIONS.MANAGE_ORDER_STATUS
  );
  const canCancelOrders = hasPermission(currentUser, PERMISSIONS.CANCEL_ORDERS);

  // Query for orders
  const { data: ordersData, isLoading: loading } = useQuery({
    queryKey: ["orders", page, pageSize, filters],
    queryFn: async () => {
      const params = {
        page,
        limit: pageSize,
        ...filters,
        orderNumber: filters.search,
        email: filters.search,
      };

      if (filters.dateRange && filters.dateRange.length === 2) {
        params.startDate = filters.dateRange[0].toISOString();
        params.endDate = filters.dateRange[1].toISOString();
      }

      // Remove empty filters
      Object.keys(params).forEach((key) => {
        if (params[key] === "" || params[key] === null) delete params[key];
      });

      const response = await OrderApi.getAll(params);
      return {
        orders: response.data?.orders || [],
        total: response.data?.total || 0,
      };
    },
  });

  const orders = Array.isArray(ordersData?.orders) ? ordersData.orders : [];
  const total = ordersData?.total || 0;

  // Query for stats
  const { data: stats } = useQuery({
    queryKey: ["orders", "stats"],
    queryFn: async () => {
      const response = await OrderApi.getStats();
      return response.data;
    },
  });

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      status: null,
      paymentStatus: null,
      dateRange: null,
    });
    setPage(1);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getStatusTag = (status) => {
    const color = ORDER_STATUS_COLORS[status] || "default";
    const label = ORDER_STATUS_LABELS[status] || status;
    return <Tag color={color}>{label}</Tag>;
  };

  const getPaymentStatusTag = (status) => {
    const color = PAYMENT_STATUS_COLORS[status] || "default";
    const label = PAYMENT_STATUS_LABELS[status] || status;
    return <Tag color={color}>{label}</Tag>;
  };

  const handleViewDetail = (order) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  const handleUpdateStatus = (order) => {
    setSelectedOrder(order);
    setStatusModalVisible(true);
  };

  const handleStatusUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  };

  const columns = [
    {
      title: "Mã đơn hàng",
      dataIndex: "orderNumber",
      key: "orderNumber",
      width: 150,
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Khách hàng",
      key: "customer",
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record?.shippingInfo?.phone || record?.shipping?.name}</div>
          <div style={{ fontSize: 12, color: "#666" }}>
            {record.customer?.email}
          </div>
        </div>
      ),
    },
    {
      title: "Sản phẩm",
      dataIndex: "items",
      key: "items",
      width: 100,
      render: (_, record) => `${record?.products?.length || 0} sản phẩm`,
    },
    {
      title: "Tổng tiền",
      key: "total",
      width: 150,
      render: (_, record) => (
        <strong style={{ color: "#1890ff" }}>
          {formatPrice(record.pricing?.total)}
        </strong>
      ),
    },
    {
      title: "Thanh toán",
      key: "payment",
      width: 150,
      render: (_, record) => (
        <div>
          {getPaymentStatusTag(record.payment?.status)}
          <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
            {record.payment?.method === "stripe"
              ? "Stripe"
              : record.payment?.method === "cod"
              ? "COD"
              : "Khác"}
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status) => getStatusTag(status),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space size={0}>
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>

          {canManageOrderStatus && (
            <Tooltip title="Cập nhật trạng thái">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleUpdateStatus(record)}
              />
            </Tooltip>
          )}

          {canCancelOrders && (
            <Tooltip title="Hủy đơn hàng">
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                danger
                disabled={
                  record.status === "cancelled" || record.status === "completed"
                }
                onClick={() =>
                  handleUpdateStatus({ ...record, status: "pending" })
                }
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          Quản lý đơn hàng
        </Title>
      </Flex>

      {/* Statistics */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={hasRole(getCurrentUser(), ["admin"]) ? 6 : 8}>
            <Card>
              <Statistic
                title="Tổng đơn hàng"
                value={stats.totalOrders}
                prefix={<ShoppingCartOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col span={hasRole(getCurrentUser(), ["admin"]) ? 6 : 8}>
            <Card>
              <Statistic
                title="Chờ xử lý"
                value={stats.pendingOrders + stats.confirmedOrders}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
          <Col span={hasRole(getCurrentUser(), ["admin"]) ? 6 : 8}>
            <Card>
              <Statistic
                title="Hoàn thành"
                value={stats.completedOrders}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          {hasRole(getCurrentUser(), ["admin"]) && (
            <Col span={6}>
              <Card>
                <Statistic
                  title="Doanh thu"
                  value={stats.totalRevenue}
                  prefix={<DollarOutlined />}
                  precision={0}
                  valueStyle={{ color: "#3f8600" }}
                  formatter={(value) => formatPrice(value)}
                />
              </Card>
            </Col>
          )}
        </Row>
      )}

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={6}>
            <Input
              placeholder="Tìm theo mã đơn hoặc email..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Trạng thái đơn hàng"
              value={filters.status}
              onChange={(value) => handleFilterChange("status", value)}
              allowClear
              style={{ width: "100%" }}
            >
              <Option value="pending">Chờ xác nhận</Option>
              <Option value="confirmed">Đã xác nhận</Option>
              <Option value="processing">Đang xử lý</Option>
              <Option value="preparing">Đang chuẩn bị</Option>
              <Option value="shipped">Đã giao vận chuyển</Option>
              <Option value="delivered">Đã giao hàng</Option>
              <Option value="completed">Hoàn thành</Option>
              <Option value="cancelled">Đã hủy</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="Trạng thái thanh toán"
              value={filters.paymentStatus}
              onChange={(value) => handleFilterChange("paymentStatus", value)}
              allowClear
              style={{ width: "100%" }}
            >
              <Option value="pending">Chờ thanh toán</Option>
              <Option value="paid">Đã thanh toán</Option>
              <Option value="failed">Thất bại</Option>
              <Option value="refunded">Đã hoàn tiền</Option>
            </Select>
          </Col>
          <Col span={6}>
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => handleFilterChange("dateRange", dates)}
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
            />
          </Col>
          <Col span={4}>
            <Button onClick={handleClearFilters}>Xóa bộ lọc</Button>
          </Col>
        </Row>
      </Card>

      {/* Orders Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={orders}
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
              `${range[0]}-${range[1]} của ${total} đơn hàng`
            }
            onChange={(newPage, newPageSize) => {
              setPage(newPage);
              setPageSize(newPageSize);
            }}
          />
        </Flex>
      </Card>

      {/* Modals */}
      <OrderDetailModal
        visible={detailModalVisible}
        orderId={selectedOrder?._id}
        onClose={() => {
          setDetailModalVisible(false);
          setSelectedOrder(null);
        }}
        onUpdate={(order) => {
          setDetailModalVisible(false);
          handleUpdateStatus(order);
        }}
      />

      <OrderStatusModal
        visible={statusModalVisible}
        order={selectedOrder}
        onClose={() => {
          setStatusModalVisible(false);
          setSelectedOrder(null);
        }}
        onSuccess={handleStatusUpdated}
      />
    </div>
  );
};

export default OrdersPage;
