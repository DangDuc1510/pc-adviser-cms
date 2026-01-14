"use client";

import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  DatePicker,
  Select,
  Space,
  Spin,
  Alert,
  Tabs,
  Table,
  Tag,
} from "antd";
import {
  DollarCircleOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  ProductOutlined,
  RiseOutlined,
  FallOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { StatisticsApi } from "@/apis/statistics";
import {
  getCurrentUser,
  hasPermission,
  hasRole,
  PERMISSIONS,
} from "@/utils/permissions";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const AnalyticsPage = () => {
  const currentUser = getCurrentUser();
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, "day"),
    dayjs(),
  ]);
  const [period, setPeriod] = useState("30days");

  // Check if user has permission to view analytics
  const canViewAnalytics = hasPermission(
    currentUser,
    PERMISSIONS.VIEW_ANALYTICS
  );

  // Get dashboard statistics
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ["analytics", "stats"],
    queryFn: async () => {
      const response = await StatisticsApi.getDashboardStats();
      return response.data;
    },
    refetchInterval: 60000,
    enabled: canViewAnalytics,
  });

  // Get orders chart data
  const { data: ordersChartData, isLoading: ordersChartLoading } = useQuery({
    queryKey: ["analytics", "orders-chart", dateRange],
    queryFn: async () => {
      const response = await StatisticsApi.getOrdersChartData({
        startDate: dateRange[0].toISOString(),
        endDate: dateRange[1].toISOString(),
      });
      return response.data;
    },
    enabled: canViewAnalytics,
  });

  // Get revenue chart data
  const { data: revenueChartData, isLoading: revenueChartLoading } = useQuery({
    queryKey: ["analytics", "revenue-chart", dateRange],
    queryFn: async () => {
      const response = await StatisticsApi.getRevenueChartData({
        startDate: dateRange[0].toISOString(),
        endDate: dateRange[1].toISOString(),
      });
      return response.data;
    },
    enabled: canViewAnalytics,
  });

  // Get orders by status
  const { data: ordersByStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["analytics", "orders-status"],
    queryFn: async () => {
      const response = await StatisticsApi.getOrdersByStatus();
      return response.data;
    },
    enabled: canViewAnalytics,
  });

  if (!canViewAnalytics) {
    return (
      <div className="p-6">
        <Alert
          message="Không có quyền truy cập"
          description="Bạn không có quyền xem trang phân tích. Vui lòng liên hệ quản trị viên."
          type="warning"
          showIcon
        />
      </div>
    );
  }

  const stats = statsData || {};
  const orders = stats.orders || {};
  const customers = stats.customers || {};
  const products = stats.products || {};

  // Format chart data
  const formattedOrdersChart = (ordersChartData || []).map((item) => ({
    date: dayjs(item.date).format("DD/MM"),
    orders: item.orders,
    revenue: item.revenue,
  }));

  const formattedRevenueChart = (revenueChartData || []).map((item) => ({
    date: dayjs(item.date).format("DD/MM"),
    revenue: item.revenue,
  }));

  // Calculate growth rates (mock data for now)
  const calculateGrowth = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const revenueGrowth = calculateGrowth(
    orders.totalRevenue || 0,
    (orders.totalRevenue || 0) * 0.9
  );
  const ordersGrowth = calculateGrowth(
    orders.totalOrders || 0,
    (orders.totalOrders || 0) * 0.95
  );
  const customersGrowth = calculateGrowth(
    customers.total || 0,
    (customers.total || 0) * 0.98
  );

  // Format orders by status for pie chart
  const statusColors = {
    pending: "#faad14",
    confirmed: "#1890ff",
    processing: "#13c2c2",
    shipped: "#52c41a",
    delivered: "#52c41a",
    completed: "#52c41a",
    cancelled: "#ff4d4f",
    refunded: "#ff7875",
  };

  const pieChartData = ordersByStatus
    ? Object.entries(ordersByStatus).map(([status, count]) => ({
        name: status,
        value: count,
      }))
    : [];

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handlePeriodChange = (value) => {
    setPeriod(value);
    const today = dayjs();
    switch (value) {
      case "7days":
        setDateRange([today.subtract(7, "day"), today]);
        break;
      case "30days":
        setDateRange([today.subtract(30, "day"), today]);
        break;
      case "90days":
        setDateRange([today.subtract(90, "day"), today]);
        break;
      case "1year":
        setDateRange([today.subtract(1, "year"), today]);
        break;
      default:
        break;
    }
  };

  // Top products table data (mock for now)
  const topProductsColumns = [
    {
      title: "Sản phẩm",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Số lượng bán",
      dataIndex: "sold",
      key: "sold",
      align: "right",
    },
    {
      title: "Doanh thu",
      dataIndex: "revenue",
      key: "revenue",
      align: "right",
      render: (value) => formatPrice(value),
    },
  ];

  const topProductsData = [
    {
      key: "1",
      name: "ASUS ROG Strix RX 7900 XTX",
      sold: 15,
      revenue: 524850000,
    },
    {
      key: "2",
      name: "MSI GeForce RTX 4080 SUPER",
      sold: 12,
      revenue: 395880000,
    },
    {
      key: "3",
      name: "Corsair iCUE H100i RGB Elite",
      sold: 8,
      revenue: 36720000,
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="!mb-2">
          Phân tích & Thống kê
        </Title>
        <Text type="secondary">
          Xem chi tiết về hiệu suất kinh doanh và xu hướng
        </Text>
      </div>

      {statsError && (
        <Alert
          message="Lỗi tải dữ liệu"
          description="Không thể tải dữ liệu thống kê. Vui lòng thử lại sau."
          type="error"
          showIcon
          className="mb-6"
        />
      )}

      {/* Filters */}
      <Card className="!mb-6">
        <Space>
          <Text strong>Khoảng thời gian:</Text>
          <Select
            value={period}
            onChange={handlePeriodChange}
            style={{ width: 150 }}
          >
            <Option value="7days">7 ngày qua</Option>
            <Option value="30days">30 ngày qua</Option>
            <Option value="90days">90 ngày qua</Option>
            <Option value="1year">1 năm qua</Option>
            <Option value="custom">Tùy chọn</Option>
          </Select>
          {period === "custom" && (
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              format="DD/MM/YYYY"
            />
          )}
        </Space>
      </Card>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} className="mb-6">
        {hasRole(currentUser, ["admin", "employee"]) && (
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng doanh thu"
                value={formatPrice(orders.totalRevenue || 0)}
                prefix={<DollarCircleOutlined />}
                valueStyle={{ color: "#1890ff" }}
                loading={statsLoading}
              />
              <div className="mt-2">
                {revenueGrowth >= 0 ? (
                  <Text type="success">
                    <RiseOutlined /> {revenueGrowth.toFixed(1)}%
                  </Text>
                ) : (
                  <Text type="danger">
                    <FallOutlined /> {revenueGrowth.toFixed(1)}%
                  </Text>
                )}
                <Text type="secondary" className="ml-2">
                  so với kỳ trước
                </Text>
              </div>
            </Card>
          </Col>
        )}
        <Col
          xs={24}
          sm={12}
          lg={hasRole(currentUser, ["admin", "employee"]) ? 6 : 8}
        >
          <Card>
            <Statistic
              title="Tổng đơn hàng"
              value={orders.totalOrders || 0}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: "#52c41a" }}
              loading={statsLoading}
            />
            <div className="mt-2">
              {ordersGrowth >= 0 ? (
                <Text type="success">
                  <RiseOutlined /> {ordersGrowth.toFixed(1)}%
                </Text>
              ) : (
                <Text type="danger">
                  <FallOutlined /> {ordersGrowth.toFixed(1)}%
                </Text>
              )}
              <Text type="secondary" className="ml-2">
                so với kỳ trước
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng khách hàng"
              value={customers.total || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#722ed1" }}
              loading={statsLoading}
            />
            <div className="mt-2">
              {customersGrowth >= 0 ? (
                <Text type="success">
                  <RiseOutlined /> {customersGrowth.toFixed(1)}%
                </Text>
              ) : (
                <Text type="danger">
                  <FallOutlined /> {customersGrowth.toFixed(1)}%
                </Text>
              )}
              <Text type="secondary" className="ml-2">
                so với kỳ trước
              </Text>
            </div>
          </Card>
        </Col>
        <Col
          xs={24}
          sm={12}
          lg={hasRole(currentUser, ["admin", "employee"]) ? 6 : 8}
        >
          <Card>
            <Statistic
              title="Tỷ lệ hoàn thành"
              value={
                orders.totalOrders > 0
                  ? (
                      (orders.completedOrders / orders.totalOrders) *
                      100
                    ).toFixed(1)
                  : 0
              }
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: "#fa8c16" }}
              loading={statsLoading}
            />
            <div className="mt-2">
              <Text type="secondary">
                {orders.completedOrders || 0} / {orders.totalOrders || 0} đơn
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Tabs
        defaultActiveKey="1"
        items={[
          {
            key: "1",
            label: hasRole(currentUser, ["admin", "employee"])
              ? "Doanh thu & Đơn hàng"
              : "Đơn hàng",
            children: (
              <Row gutter={[16, 16]}>
                {hasRole(currentUser, ["admin", "employee"]) && (
                  <Col xs={24} lg={12}>
                    <Card title="Doanh thu theo thời gian">
                      <Spin spinning={revenueChartLoading}>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={formattedRevenueChart}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip
                              formatter={(value) => formatPrice(value)}
                            />
                            <Legend />
                            <Area
                              type="monotone"
                              dataKey="revenue"
                              stroke="#52c41a"
                              fill="#52c41a"
                              fillOpacity={0.6}
                              name="Doanh thu"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </Spin>
                    </Card>
                  </Col>
                )}
                <Col
                  xs={24}
                  lg={hasRole(currentUser, ["admin", "employee"]) ? 12 : 24}
                >
                  <Card title="Đơn hàng theo thời gian">
                    <Spin spinning={ordersChartLoading}>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={formattedOrdersChart}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar
                            dataKey="orders"
                            fill="#1890ff"
                            name="Số đơn hàng"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Spin>
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: "2",
            label: "Tổng hợp",
            children: (
              <Row gutter={[16, 16]}>
                {hasRole(currentUser, ["admin", "employee"]) && (
                  <Col xs={24} lg={12}>
                    <Card title="Doanh thu & Đơn hàng">
                      <Spin spinning={ordersChartLoading}>
                        <ResponsiveContainer width="100%" height={350}>
                          <ComposedChart data={formattedOrdersChart}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip
                              formatter={(value, name) => {
                                if (name === "revenue") {
                                  return formatPrice(value);
                                }
                                return value;
                              }}
                            />
                            <Legend />
                            <Bar
                              yAxisId="left"
                              dataKey="orders"
                              fill="#1890ff"
                              name="Số đơn hàng"
                            />
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="revenue"
                              stroke="#52c41a"
                              strokeWidth={2}
                              name="Doanh thu"
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </Spin>
                    </Card>
                  </Col>
                )}
                <Col xs={24} lg={12}>
                  <Card title="Đơn hàng theo trạng thái">
                    <Spin spinning={statusLoading}>
                      <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) =>
                              `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={statusColors[entry.name] || "#8884d8"}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Spin>
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: "3",
            label: "Sản phẩm",
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24}>
                  <Card title="Sản phẩm bán chạy">
                    <Table
                      columns={topProductsColumns}
                      dataSource={topProductsData}
                      pagination={false}
                      size="small"
                    />
                  </Card>
                </Col>
              </Row>
            ),
          },
        ]}
      />

      {/* Summary Stats */}
      <Row gutter={[16, 16]} className="mt-6">
        <Col xs={24} md={8}>
          <Card title="Thống kê đơn hàng" size="small">
            <Space direction="vertical" style={{ width: "100%" }}>
              <div className="flex justify-between">
                <Text>Đơn hàng chờ xử lý:</Text>
                <Tag color="orange">{orders.pendingOrders || 0}</Tag>
              </div>
              <div className="flex justify-between">
                <Text>Đơn hàng đã xác nhận:</Text>
                <Tag color="blue">{orders.confirmedOrders || 0}</Tag>
              </div>
              <div className="flex justify-between">
                <Text>Đơn hàng hoàn thành:</Text>
                <Tag color="green">{orders.completedOrders || 0}</Tag>
              </div>
              <div className="flex justify-between">
                <Text>Đơn hàng đã hủy:</Text>
                <Tag color="red">
                  {(orders.totalOrders || 0) -
                    (orders.completedOrders || 0) -
                    (orders.pendingOrders || 0) -
                    (orders.confirmedOrders || 0)}
                </Tag>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Thống kê khách hàng" size="small">
            <Space direction="vertical" style={{ width: "100%" }}>
              <div className="flex justify-between">
                <Text>Tổng khách hàng:</Text>
                <Tag color="blue">{customers.total || 0}</Tag>
              </div>
              <div className="flex justify-between">
                <Text>Khách đã đăng ký:</Text>
                <Tag color="green">{customers.registered || 0}</Tag>
              </div>
              <div className="flex justify-between">
                <Text>Khách chưa đăng ký:</Text>
                <Tag color="orange">{customers.guest || 0}</Tag>
              </div>
              <div className="flex justify-between">
                <Text>Tổng chi tiêu:</Text>
                <Text strong>{formatPrice(customers.totalSpent || 0)}</Text>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Thống kê sản phẩm" size="small">
            <Space direction="vertical" style={{ width: "100%" }}>
              <div className="flex justify-between">
                <Text>Tổng sản phẩm:</Text>
                <Tag color="blue">{products.totalProducts || 0}</Tag>
              </div>
              <div className="flex justify-between">
                <Text>Danh mục:</Text>
                <Tag color="green">{products.totalCategories || 0}</Tag>
              </div>
              <div className="flex justify-between">
                <Text>Thương hiệu:</Text>
                <Tag color="purple">{products.totalBrands || 0}</Tag>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AnalyticsPage;
