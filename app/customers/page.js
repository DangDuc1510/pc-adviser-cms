"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Select,
  Tag,
  message,
  Statistic,
  Row,
  Col,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  UserOutlined,
  BarChartOutlined,
  SyncOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { CustomerApi } from "@/apis/customer";
import { SegmentationApi } from "@/apis/segmentation";
import { debounce } from "@/utils";
import { formatPrice } from "@/utils/format";
import { extractUserId } from "@/utils/customer";

const { Option } = Select;

const CustomersPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    customerType: null,
    segmentationType: null,
  });

  // Query for customers
  const {
    data: customersData,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ["customers", pagination.current, pagination.pageSize, filters],
    queryFn: async () => {
      let response;

      // If filtering by segmentation type, use segmentation API
      if (filters.segmentationType) {
        response = await SegmentationApi.getCustomersBySegment(
          filters.segmentationType,
          {
            page: pagination.current,
            limit: pagination.pageSize,
          }
        );
        return {
          customers: response.data?.customers || response.customers || [],
          pagination: response.data?.pagination ||
            response.pagination || { current: 1, total: 0, pages: 0 },
        };
      }

      // Otherwise use regular customer API
      const queryParams = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters,
      };

      response = await CustomerApi.getAll(queryParams);
      return {
        customers: response.customers || [],
        pagination: response.pagination || { current: 1, total: 0, pages: 0 },
      };
    },
  });

  // Query for stats
  const { data: statsData } = useQuery({
    queryKey: ["customerStats"],
    queryFn: async () => {
      const response = await CustomerApi.getStats();
      return response;
    },
  });

  // Query for segmentation stats
  const { data: segmentationStats } = useQuery({
    queryKey: ["segmentationStats"],
    queryFn: async () => {
      const response = await SegmentationApi.getStats();
      return response.data || response;
    },
  });

  // Mutation to analyze customer
  const analyzeCustomerMutation = useMutation({
    mutationFn: async (customer) => {
      // Extract userId from customer object
      const userId = extractUserId(customer);
      const identifier = userId || customer._id;
      if (!identifier) {
        throw new Error("Không tìm thấy userId hoặc customerId");
      }
      return await SegmentationApi.forceAnalyzeCustomer(identifier);
    },
    onSuccess: () => {
      messageApi.success("Phân tích thành công");
      queryClient.invalidateQueries(["customers"]);
      queryClient.invalidateQueries(["segmentationStats"]);
    },
    onError: (error) => {
      messageApi.error(
        "Phân tích thất bại: " + (error.message || "Lỗi không xác định")
      );
    },
  });

  // Mutation to analyze all customers
  const analyzeAllCustomersMutation = useMutation({
    mutationFn: async (params = {}) => {
      return await SegmentationApi.analyzeAllCustomers({
        forceUpdate: true,
        batchSize: 10,
        ...params,
      });
    },
    onSuccess: (data) => {
      const result = data.data || data;
      messageApi.success(
        `Phân loại thành công: ${result.success || 0} thành công, ${
          result.failed || 0
        } thất bại trong ${Math.round((result.duration || 0) / 1000)}s`
      );
      queryClient.invalidateQueries(["customers"]);
      queryClient.invalidateQueries(["segmentationStats"]);
      queryClient.invalidateQueries(["customerStats"]);
    },
    onError: (error) => {
      messageApi.error(
        "Phân loại thất bại: " + (error.message || "Lỗi không xác định")
      );
    },
  });

  const customers = customersData?.customers || [];
  const paginationData = customersData?.pagination || {
    current: 1,
    total: 0,
    pages: 0,
  };

  // Handle table change
  const handleTableChange = (newPagination) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
      total: newPagination.total,
    });
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  // Debounced search
  const debouncedSearchChange = useMemo(
    () =>
      debounce((value) => {
        handleFilterChange("search", value);
      }, 500),
    []
  );

  const handleSearchInputChange = (e) => {
    debouncedSearchChange(e.target.value);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      search: "",
      customerType: null,
      segmentationType: null,
    });
  };

  // Get segmentation tag color and text
  const getSegmentationTag = (segmentation) => {
    if (!segmentation || !segmentation.type) {
      return <Tag color="default">Chưa phân loại</Tag>;
    }

    const config = {
      potential: { color: "cyan", text: "Tiềm năng" },
      loyal: { color: "green", text: "Trung thành" },
      at_risk: { color: "orange", text: "Chuẩn bị rời bỏ" },
      churned: { color: "red", text: "Rời bỏ" },
    };

    const segConfig = config[segmentation.type] || {
      color: "default",
      text: segmentation.type,
    };
    return (
      <Tag color={segConfig.color}>
        {segConfig.text}
        {segmentation.score !== undefined && ` (điểm: ${segmentation.score})`}
      </Tag>
    );
  };

  // Table columns
  const columns = [
    {
      title: "ID",
      dataIndex: "_id",
      key: "_id",
      width: 120,
      render: (id) => id?.substring(0, 8) + "...",
    },
    {
      title: "Loại",
      dataIndex: "customerType",
      key: "customerType",
      width: 120,
      render: (type) => (
        <Tag color={type === "registered" ? "blue" : "orange"}>
          {type === "registered" ? "Đã đăng ký" : "Khách"}
        </Tag>
      ),
    },
    {
      title: "Phân loại",
      dataIndex: "segmentation",
      key: "segmentation",
      width: 180,
      render: (segmentation) => getSegmentationTag(segmentation),
    },
    {
      title: "Thông tin",
      key: "info",
      render: (_, record) => {
        if (record.userId) {
          return (
            <div>
              <div>
                <strong>
                  {record.userId?.userName || record.userId?.email}
                </strong>
              </div>
              <div style={{ fontSize: 12, color: "#999" }}>
                {record.userId?.email}
              </div>
            </div>
          );
        }
        return (
          <div>
            <div>
              <strong>Guest</strong>
            </div>
          </div>
        );
      },
    },
    {
      title: "Đơn hàng",
      dataIndex: "totalOrders",
      key: "totalOrders",
      width: 100,
      align: "center",
      render: (count) => count || 0,
    },
    {
      title: "Tổng chi tiêu",
      dataIndex: "totalSpent",
      key: "totalSpent",
      width: 150,
      align: "right",
      render: (amount) => formatPrice(amount || 0),
    },
    {
      title: "Lần cuối",
      dataIndex: "lastSeenAt",
      key: "lastSeenAt",
      width: 180,
      render: (date) => (date ? new Date(date).toLocaleString("vi-VN") : "-"),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/customers/${record._id}`)}
          >
            Xem
          </Button>
          <Button
            type="link"
            icon={<SyncOutlined />}
            size="small"
            loading={analyzeCustomerMutation.isPending}
            onClick={() => analyzeCustomerMutation.mutate(record)}
            title="Phân tích lại"
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <div style={{ padding: "24px" }}>
        <Card>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
              Quản lý Khách hàng
            </h1>
            <p style={{ margin: "8px 0 0 0", color: "#666" }}>
              Quản lý và theo dõi thông tin khách hàng
            </p>
          </div>

          {/* Stats */}
          {statsData && (
            <>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Tổng khách hàng"
                      value={statsData.total || 0}
                      prefix={<UserOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Đã đăng ký"
                      value={statsData.registered || 0}
                      valueStyle={{ color: "#1890ff" }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Khách"
                      value={statsData.guest || 0}
                      valueStyle={{ color: "#faad14" }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Tổng chi tiêu"
                      value={statsData.totalSpent || 0}
                      prefix="₫"
                      formatter={(value) => formatPrice(value)}
                    />
                  </Card>
                </Col>
              </Row>
              {segmentationStats && (
                <Row gutter={16} style={{ marginBottom: 24 }}>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="Tiềm năng"
                        value={segmentationStats.potential?.count || 0}
                        valueStyle={{ color: "#13c2c2" }}
                        prefix={<BarChartOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="Trung thành"
                        value={segmentationStats.loyal?.count || 0}
                        valueStyle={{ color: "#52c41a" }}
                        prefix={<BarChartOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="Chuẩn bị rời bỏ"
                        value={segmentationStats.at_risk?.count || 0}
                        valueStyle={{ color: "#fa8c16" }}
                        prefix={<BarChartOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="Rời bỏ"
                        value={segmentationStats.churned?.count || 0}
                        valueStyle={{ color: "#ff4d4f" }}
                        prefix={<BarChartOutlined />}
                      />
                    </Card>
                  </Col>
                </Row>
              )}
            </>
          )}

          {/* Filters */}
          <Card style={{ marginBottom: 16 }}>
            <Space wrap>
              <Input
                placeholder="Tìm kiếm theo email, tên..."
                prefix={<SearchOutlined />}
                style={{ width: 300 }}
                onChange={handleSearchInputChange}
                allowClear
              />
              <Select
                placeholder="Loại khách hàng"
                style={{ width: 200 }}
                allowClear
                value={filters.customerType}
                onChange={(value) => handleFilterChange("customerType", value)}
              >
                <Option value="registered">Đã đăng ký</Option>
                <Option value="guest">Khách</Option>
              </Select>
              <Select
                placeholder="Phân loại"
                style={{ width: 200 }}
                allowClear
                value={filters.segmentationType}
                onChange={(value) =>
                  handleFilterChange("segmentationType", value)
                }
              >
                <Option value="potential">Tiềm năng</Option>
                <Option value="loyal">Trung thành</Option>
                <Option value="at_risk">Chuẩn bị rời bỏ</Option>
                <Option value="churned">Rời bỏ</Option>
              </Select>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  clearFilters();
                  refetch();
                }}
              >
                Làm mới
              </Button>
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                loading={analyzeAllCustomersMutation.isPending}
                onClick={() => {
                  analyzeAllCustomersMutation.mutate();
                }}
              >
                Phân loại tất cả
              </Button>
            </Space>
          </Card>

          {/* Table */}
          <Table
            columns={columns}
            dataSource={customers}
            rowKey="_id"
            loading={loading}
            pagination={{
              current: paginationData.current,
              pageSize: pagination.pageSize,
              total: paginationData.total,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} khách hàng`,
              pageSizeOptions: ["10", "20", "50", "100"],
            }}
            onChange={handleTableChange}
            scroll={{ x: 1200 }}
          />
        </Card>
      </div>
    </>
  );
};

export default CustomersPage;
