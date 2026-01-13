"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  DatePicker,
  Spin,
  Alert,
} from "antd";
import {
  UserOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  DollarCircleOutlined,
  TrophyOutlined,
  ProductOutlined,
  FolderOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { StatisticsApi } from "@/apis/statistics";
import {
  hasPermission,
  getCurrentUser,
  PERMISSIONS,
} from "@/utils/permissions";
import { USER_ROLES } from "@/config/constants";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const DashboardPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, "day"),
    dayjs(),
  ]);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  // Get dashboard statistics
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const response = await StatisticsApi.getDashboardStats();
      return response.data;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Get orders chart data
  const { data: ordersChartData, isLoading: ordersChartLoading } = useQuery({
    queryKey: ["dashboard", "orders-chart", dateRange],
    queryFn: async () => {
      const response = await StatisticsApi.getOrdersChartData({
        startDate: dateRange[0].toISOString(),
        endDate: dateRange[1].toISOString(),
      });
      return response.data;
    },
  });

  // Get revenue chart data
  const { data: revenueChartData, isLoading: revenueChartLoading } = useQuery({
    queryKey: ["dashboard", "revenue-chart", dateRange],
    queryFn: async () => {
      const response = await StatisticsApi.getRevenueChartData({
        startDate: dateRange[0].toISOString(),
        endDate: dateRange[1].toISOString(),
      });
      return response.data;
    },
  });

  // Get user growth statistics
  const { data: userGrowthStats, isLoading: userGrowthLoading } = useQuery({
    queryKey: ["dashboard", "user-growth"],
    queryFn: async () => {
      const response = await StatisticsApi.getUserGrowthStats();
      return response.data;
    },
    enabled: hasPermission(currentUser, PERMISSIONS.VIEW_ANALYTICS),
  });

  const stats = statsData || {};
  const orders = stats.orders || {};
  const customers = stats.customers || {};
  const products = stats.products || {};
  const userGrowth = userGrowthStats || {
    newCustomers: 0,
    activeGrowthByWeek: [],
    deactiveByWeek: [],
  };

  // Calculate statistics
  const dashboardStats = {
    totalOrders: orders.totalOrders || 0,
    pendingOrders: orders.pendingOrders || 0,
    completedOrders: orders.completedOrders || 0,
    totalRevenue: orders.totalRevenue || 0,
    totalCustomers: customers.total || 0,
    registeredCustomers: customers.registered || 0,
    guestCustomers: customers.guest || 0,
    totalProducts: products.totalProducts || 0,
    totalCategories: products.totalCategories || 0,
    totalBrands: products.totalBrands || 0,
  };

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

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Calculate visible items count for responsive layout
  const canViewAnalytics = hasPermission(
    currentUser,
    PERMISSIONS.VIEW_ANALYTICS
  );

  // Check if user is employee
  const isEmployee = currentUser?.role === USER_ROLES.EMPLOYEE;
  const isAdmin = currentUser?.role === USER_ROLES.ADMIN;

  // Calculate column spans for orders row
  // If employee: all cards in one row (4 cards = 6 cols each)
  // If admin with analytics: 4 cards = 6 cols each
  // If admin without analytics: 3 cards = 8 cols each
  const ordersColSpan = isEmployee ? 6 : canViewAnalytics ? 6 : 8;

  // Calculate column spans for customers/products row
  // If employee: all cards in one row (4 cards = 6 cols each)
  // If admin with analytics: 4 cards = 6 cols each
  // If admin without analytics: 2 cards = 12 cols each
  const customersProductsColSpan = isEmployee ? 6 : canViewAnalytics ? 6 : 12;

  // Calculate column spans for charts row
  // If employee: 1 chart = 24 cols (no analytics charts)
  // If admin with analytics: 2 charts = 12 cols each
  // If admin without analytics: 1 chart = 24 cols
  const chartsColSpan = isEmployee ? 24 : canViewAnalytics ? 12 : 24;

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="!mb-2">
          Dashboard
        </Title>
        <Text type="secondary">
          Chào mừng trở lại, {currentUser?.userName || "Admin"}!
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

      {/* Statistics Cards */}
      {isEmployee ? (
        // Employee: All cards in one row
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} md={6} lg={6}>
            <Card className="h-full">
              <Statistic
                title="Tổng đơn hàng"
                value={dashboardStats.totalOrders}
                prefix={<ShoppingCartOutlined />}
                valueStyle={{ color: "#1890ff" }}
                loading={statsLoading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6}>
            <Card className="h-full">
              <Statistic
                title="Đơn hàng chờ xử lý"
                value={dashboardStats.pendingOrders}
                prefix={<ShoppingCartOutlined />}
                valueStyle={{ color: "#faad14" }}
                loading={statsLoading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6}>
            <Card className="h-full">
              <Statistic
                title="Tổng sản phẩm"
                value={dashboardStats.totalProducts}
                prefix={<ProductOutlined />}
                valueStyle={{ color: "#fa8c16" }}
                loading={statsLoading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6}>
            <Card className="h-full">
              <Statistic
                title="Danh mục & Thương hiệu"
                value={`${dashboardStats.totalCategories}`}
                prefix={<FolderOutlined />}
                valueStyle={{ color: "#13c2c2" }}
                loading={statsLoading}
              />
            </Card>
          </Col>
        </Row>
      ) : (
        // Admin: Multiple rows layout
        <>
          {/* Statistics Cards - Orders */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} md={ordersColSpan} lg={ordersColSpan}>
              <Card className="h-full">
                <Statistic
                  title="Tổng đơn hàng"
                  value={dashboardStats.totalOrders}
                  prefix={<ShoppingCartOutlined />}
                  valueStyle={{ color: "#1890ff" }}
                  loading={statsLoading}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={ordersColSpan} lg={ordersColSpan}>
              <Card className="h-full">
                <Statistic
                  title="Đơn hàng chờ xử lý"
                  value={dashboardStats.pendingOrders}
                  prefix={<ShoppingCartOutlined />}
                  valueStyle={{ color: "#faad14" }}
                  loading={statsLoading}
                />
              </Card>
            </Col>
            {canViewAnalytics && (
              <Col xs={24} sm={12} md={ordersColSpan} lg={ordersColSpan}>
                <Card className="h-full">
                  <Statistic
                    title="Khách hàng mới (tháng này)"
                    value={userGrowth.newCustomers}
                    prefix={<UserOutlined />}
                    valueStyle={{ color: "#52c41a" }}
                    loading={userGrowthLoading}
                  />
                </Card>
              </Col>
            )}
            {canViewAnalytics && (
              <Col xs={24} sm={12} md={ordersColSpan} lg={ordersColSpan}>
                <Card className="h-full">
                  <Statistic
                    title="Tổng doanh thu"
                    value={formatPrice(dashboardStats.totalRevenue)}
                    prefix={<DollarCircleOutlined />}
                    valueStyle={{ color: "#722ed1" }}
                    loading={statsLoading}
                  />
                </Card>
              </Col>
            )}
          </Row>

          {/* Statistics Cards - Customers & Products */}
          <Row gutter={[16, 16]} className="mb-6">
            {canViewAnalytics && (
              <Col
                xs={24}
                sm={12}
                md={customersProductsColSpan}
                lg={customersProductsColSpan}
              >
                <Card className="h-full">
                  <Statistic
                    title="Tổng khách hàng"
                    value={dashboardStats.totalCustomers}
                    prefix={<TeamOutlined />}
                    valueStyle={{ color: "#1890ff" }}
                    loading={statsLoading}
                  />
                </Card>
              </Col>
            )}
            {canViewAnalytics && (
              <Col
                xs={24}
                sm={12}
                md={customersProductsColSpan}
                lg={customersProductsColSpan}
              >
                <Card className="h-full">
                  <Statistic
                    title="Danh mục"
                    value={dashboardStats.totalBrands}
                    prefix={<ShopOutlined />}
                    valueStyle={{ color: "#fa8c16" }}
                    loading={statsLoading}
                  />
                </Card>
              </Col>
            )}
            <Col
              xs={24}
              sm={12}
              md={customersProductsColSpan}
              lg={customersProductsColSpan}
            >
              <Card className="h-full">
                <Statistic
                  title="Tổng sản phẩm"
                  value={dashboardStats.totalProducts}
                  prefix={<ProductOutlined />}
                  valueStyle={{ color: "#fa8c16" }}
                  loading={statsLoading}
                />
              </Card>
            </Col>
            <Col
              xs={24}
              sm={12}
              md={customersProductsColSpan}
              lg={customersProductsColSpan}
            >
              <Card className="h-full">
                <Statistic
                  title="Danh mục & Thương hiệu"
                  value={`${dashboardStats.totalCategories}`}
                  prefix={<FolderOutlined />}
                  valueStyle={{ color: "#13c2c2" }}
                  loading={statsLoading}
                />
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* Charts */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={chartsColSpan}>
          <Card
            className="h-full"
            title="Đơn hàng theo thời gian"
            extra={
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                format="DD/MM/YYYY"
              />
            }
          >
            <Spin spinning={ordersChartLoading}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={formattedOrdersChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="#1890ff"
                    fill="#1890ff"
                    fillOpacity={0.6}
                    name="Số đơn hàng"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Spin>
          </Card>
        </Col>
        {canViewAnalytics && (
          <Col xs={24} lg={chartsColSpan}>
            <Card
              className="h-full"
              title="Doanh thu theo thời gian"
              extra={
                <RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  format="DD/MM/YYYY"
                />
              }
            >
              <Spin spinning={revenueChartLoading}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={formattedRevenueChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatPrice(value)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#52c41a"
                      strokeWidth={2}
                      name="Doanh thu"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Spin>
            </Card>
          </Col>
        )}
      </Row>

      {/* User Growth Statistics */}
      {canViewAnalytics && (
        <>
          {/* User Growth Charts */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} lg={12}>
              <Card
                className="h-full"
                title="Tăng trưởng người dùng active theo tuần"
              >
                <Spin spinning={userGrowthLoading}>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={userGrowth.activeGrowthByWeek}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#1890ff"
                        strokeWidth={2}
                        name="Số người dùng active"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Spin>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card className="h-full" title="Người dùng deactive theo tuần">
                <Spin spinning={userGrowthLoading}>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={userGrowth.deactiveByWeek}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#ff4d4f"
                        fill="#ff4d4f"
                        fillOpacity={0.6}
                        name="Số người dùng deactive"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Spin>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
