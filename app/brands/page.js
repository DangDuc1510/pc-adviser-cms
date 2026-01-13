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
  message,
  Popconfirm,
  Switch,
  Avatar,
  Image,
  Row,
  Col,
  Statistic,
  Select,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  GlobalOutlined,
  ShopOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BrandApi } from "@/apis/products";
import BrandFormModal from "@/components/products/BrandFormModal";
import {
  getCurrentUser,
  hasPermission,
  PERMISSIONS,
} from "@/utils/permissions";

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const BrandsPage = () => {
  const queryClient = useQueryClient();
  const currentUser = getCurrentUser();
  const [searchText, setSearchText] = useState("");
  const [countryFilter, setCountryFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    pages: 0,
  });
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const canManageBrands = hasPermission(currentUser, PERMISSIONS.MANAGE_BRANDS);

  // Query for brands
  const { data: brandsData, isLoading: loading } = useQuery({
    queryKey: [
      "brands",
      pagination.current,
      pagination.pageSize,
      searchText,
      countryFilter,
      statusFilter,
      sortBy,
      sortOrder,
    ],
    queryFn: async () => {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        sortBy,
        sortOrder,
        search: searchText || undefined,
        country: countryFilter || undefined,
        isActive: statusFilter !== null ? statusFilter === "active" : undefined,
      };

      // Remove undefined values
      Object.keys(params).forEach(
        (key) => params[key] === undefined && delete params[key]
      );

      const response = await BrandApi.getAll(params);

      if (response && response.brands) {
        return {
          brands: response.brands,
          pagination: response.pagination,
        };
      } else {
        // Fallback for old API response format
        const brandsData = response || [];
        return {
          brands: brandsData,
          pagination: {
            current: 1,
            pageSize: brandsData.length,
            total: brandsData.length,
            pages: 1,
          },
        };
      }
    },
  });

  const brands = brandsData?.brands || [];
  const paginationData = brandsData?.pagination || {
    current: 1,
    pageSize: 20,
    total: 0,
    pages: 0,
  };

  // Calculate statistics
  const statistics = {
    total: paginationData.total,
    active: brands.filter((b) => b.isActive).length,
    inactive: brands.filter((b) => !b.isActive).length,
  };

  // Query for countries (for filter dropdown)
  const { data: countriesData } = useQuery({
    queryKey: ["brands", "countries"],
    queryFn: async () => {
      const response = await BrandApi.getAll();
      const brandsData = response?.brands || response || [];
      return [
        ...new Set(brandsData.map((b) => b.country).filter(Boolean)),
      ].sort();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const countries = countriesData || [];

  const handleCreateBrand = () => {
    setEditingBrand(null);
    setFormModalVisible(true);
  };

  const handleEditBrand = (brand) => {
    setEditingBrand(brand);
    setFormModalVisible(true);
  };

  const handleFormSuccess = () => {
    setFormModalVisible(false);
    setEditingBrand(null);
    queryClient.invalidateQueries({ queryKey: ["brands"] });
  };

  const handleFormCancel = () => {
    setFormModalVisible(false);
    setEditingBrand(null);
  };

  const handleDeleteBrand = async (brand) => {
    try {
      await BrandApi.delete(brand._id);
      message.success("Xóa thương hiệu thành công");
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    } catch (error) {
      message.error(
        error.response?.data?.message || "Xóa thương hiệu thất bại"
      );
      console.error("Error deleting brand:", error);
    }
  };

  const handleToggleStatus = async (brand) => {
    try {
      await BrandApi.toggleStatus(brand._id);
      message.success(
        `${
          brand.isActive ? "Ngừng kích hoạt" : "Kích hoạt"
        } thương hiệu thành công`
      );
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    } catch (error) {
      message.error("Cập nhật trạng thái thương hiệu thất bại");
    }
  };

  const clearFilters = () => {
    setSearchText("");
    setCountryFilter(null);
    setStatusFilter(null);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleTableChange = (paginationInfo, filters, sorter) => {
    setPagination((prev) => ({
      ...prev,
      current: paginationInfo.current,
      pageSize: paginationInfo.pageSize,
    }));

    if (sorter.field) {
      setSortBy(sorter.field);
      setSortOrder(sorter.order === "descend" ? "desc" : "asc");
    }
  };

  const columns = [
    {
      title: "Thương hiệu",
      dataIndex: "name",
      key: "name",
      width: 200,
      sorter: true,
      sortOrder:
        sortBy === "name"
          ? sortOrder === "desc"
            ? "descend"
            : "ascend"
          : null,
      render: (text, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {record.logo ? (
            <Avatar
              src={record.logo}
              size={40}
              shape="square"
              style={{ backgroundColor: "#f5f5f5" }}
            />
          ) : (
            <Avatar
              size={40}
              shape="square"
              style={{ backgroundColor: "#1890ff" }}
            >
              {text.charAt(0).toUpperCase()}
            </Avatar>
          )}
          <div>
            <div style={{ fontWeight: 500, marginBottom: 2 }}>
              {text}
              {!record.isActive && (
                <Tag color="red" size="small" style={{ marginLeft: 8 }}>
                  Ngừng hoạt động
                </Tag>
              )}
            </div>
            {record.description && (
              <div
                style={{
                  color: "#666",
                  fontSize: 12,
                  maxWidth: 200,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {record.description}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Quốc gia",
      dataIndex: "country",
      key: "country",
      width: 120,
      sorter: true,
      sortOrder:
        sortBy === "country"
          ? sortOrder === "desc"
            ? "descend"
            : "ascend"
          : null,
      render: (country) =>
        country ? (
          <Tag icon={<GlobalOutlined />} color="blue">
            {country}
          </Tag>
        ) : (
          <Tag color="default">Chưa xác định</Tag>
        ),
    },
    ...(canManageBrands
      ? [
          {
            title: "Trạng thái",
            key: "status",
            width: 120,
            render: (_, record) => (
              <Switch
                checked={record.isActive}
                onChange={() => handleToggleStatus(record)}
                checkedChildren="Hoạt động"
                unCheckedChildren="Ngừng hoạt động"
                size="small"
              />
            ),
          },
        ]
      : []),
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      sorter: true,
      sortOrder:
        sortBy === "createdAt"
          ? sortOrder === "desc"
            ? "descend"
            : "ascend"
          : null,
      render: (date) => (
        <span style={{ fontSize: 12, color: "#666" }}>
          {date ? new Date(date).toLocaleDateString() : "-"}
        </span>
      ),
    },
    ...(canManageBrands
      ? [
          {
            title: "Thao tác",
            key: "actions",
            width: 120,
            render: (_, record) => (
              <Space size={0}>
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEditBrand(record)}
                />
                <Popconfirm
                  title={`Xóa "${record.name}"?`}
                  description="Bạn có chắc chắn muốn xóa thương hiệu này? Hành động này không thể hoàn tác."
                  onConfirm={() => handleDeleteBrand(record)}
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
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          Quản lý Thương hiệu
        </Title>
        {canManageBrands && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateBrand}
          >
            Thêm Thương hiệu
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Search
              placeholder="Tìm kiếm thương hiệu..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Lọc theo Quốc gia"
              value={countryFilter}
              onChange={setCountryFilter}
              allowClear
              style={{ width: "100%" }}
            >
              {countries.map((country) => (
                <Option key={country} value={country}>
                  {country}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="Lọc theo Trạng thái"
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              style={{ width: "100%" }}
            >
              <Option value="active">Hoạt động</Option>
              <Option value="inactive">Ngừng hoạt động</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Button onClick={clearFilters}>Xóa Bộ lọc</Button>
          </Col>
        </Row>
      </Card>

      {/* Brands Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={brands}
          loading={loading}
          rowKey="_id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: paginationData.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} thương hiệu`,
          }}
          onChange={handleTableChange}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ padding: 16, background: "#fafafa" }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <strong>Mô tả:</strong>
                    <p>{record.description || "Không có mô tả"}</p>
                  </Col>
                  <Col span={12}>
                    <strong>Thông tin SEO:</strong>
                    <p>Tiêu đề Meta: {record.metaTitle || "Chưa thiết lập"}</p>
                    <p>
                      Mô tả Meta: {record.metaDescription || "Chưa thiết lập"}
                    </p>
                    {record.metaKeywords?.length > 0 && (
                      <p>Từ khóa: {record.metaKeywords.join(", ")}</p>
                    )}
                  </Col>
                </Row>
              </div>
            ),
            rowExpandable: (record) =>
              !!record.description ||
              !!record.metaTitle ||
              !!record.metaDescription,
          }}
        />
      </Card>

      {/* Brand Form Modal */}
      <BrandFormModal
        visible={formModalVisible}
        onCancel={handleFormCancel}
        onSuccess={handleFormSuccess}
        brand={editingBrand}
      />
    </div>
  );
};

export default BrandsPage;
