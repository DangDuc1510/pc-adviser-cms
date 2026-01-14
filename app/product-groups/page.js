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
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ProductGroupApi } from "@/apis/products";
import {
  getCurrentUser,
  hasPermission,
  PERMISSIONS,
} from "@/utils/permissions";

const { Title } = Typography;
const { Option } = Select;

const ProductGroupsPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUser = getCurrentUser();
  const [messageApi, contextHolder] = message.useMessage();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({
    search: "",
    type: null,
    isActive: null,
    createdByRole: "admin,employee", // Default: only show admin and employee product groups
    sort: "newest",
  });

  const canManageProductGroups = hasPermission(
    currentUser,
    PERMISSIONS.MANAGE_PRODUCT_GROUPS
  );

  // Query for product groups
  const { data: groupsData, isLoading: loading } = useQuery({
    queryKey: ["product-groups", page, pageSize, filters],
    queryFn: async () => {
      const params = {
        page,
        limit: pageSize,
        ...filters,
      };

      // Remove empty filters
      Object.keys(params).forEach((key) => {
        if (
          params[key] === "" ||
          params[key] === null ||
          params[key] === undefined
        ) {
          delete params[key];
        }
      });

      const response = await ProductGroupApi.getAll(params);
      return response?.data || response;
    },
  });

  const groups = Array.isArray(groupsData?.groups)
    ? groupsData.groups
    : Array.isArray(groupsData)
    ? groupsData
    : [];
  const paginationData = groupsData?.pagination || {
    current: page,
    pageSize: pageSize,
    total: 0,
    pages: 0,
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await ProductGroupApi.delete(id);
    },
    onSuccess: () => {
      messageApi.success("Xóa nhóm sản phẩm thành công");
      queryClient.invalidateQueries({ queryKey: ["product-groups"] });
    },
    onError: () => {
      messageApi.error("Xóa nhóm sản phẩm thất bại");
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async (id) => {
      return await ProductGroupApi.toggleStatus(id);
    },
    onSuccess: () => {
      messageApi.success("Cập nhật trạng thái thành công");
      queryClient.invalidateQueries({ queryKey: ["product-groups"] });
    },
    onError: () => {
      messageApi.error("Cập nhật trạng thái thất bại");
    },
  });

  const handleFilterChange = (key, value) => {
    // For createdByRole, if cleared, set back to default (admin,employee)
    if (key === "createdByRole" && (value === null || value === undefined)) {
      value = "admin,employee";
    }
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filter changes
  };

  const handleCreateGroup = () => {
    router.push("/product-groups/new");
  };

  const handleEditGroup = (group) => {
    router.push(`/product-groups/${group._id}`);
  };

  const handleDeleteGroup = async (group) => {
    deleteMutation.mutate(group._id);
  };

  const handleToggleStatus = async (group) => {
    toggleStatusMutation.mutate(group._id);
  };

  const handleViewGroup = (group) => {
    router.push(`/product-groups/${group._id}`);
  };

  const getTypeTag = (type) => {
    const typeConfig = {
      combo: { color: "blue", label: "Combo" },
      "pc-config": { color: "green", label: "Cấu hình PC" },
    };
    const config = typeConfig[type] || { color: "default", label: type };
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  const getStatusTag = (isActive) => {
    return isActive ? (
      <Tag color="green">Đang hoạt động</Tag>
    ) : (
      <Tag color="red">Ngừng hoạt động</Tag>
    );
  };

  const columns = [
    {
      title: "Tên nhóm",
      dataIndex: "name",
      key: "name",
      width: 100,
      fixed: "left",

      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{text}</div>
          {record.shortDescription && (
            <div
              style={{
                fontSize: 12,
                color: "#999",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {record.shortDescription}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (type) => getTypeTag(type),
    },
    {
      title: "Số sản phẩm",
      key: "productCount",
      width: 120,
      render: (_, record) => (
        <Tag>
          {Array.isArray(record.products) ? record.products.length : 0} sản phẩm
        </Tag>
      ),
    },
    {
      title: "Lượt xem",
      dataIndex: "views",
      key: "views",
      width: 100,
      render: (views) => views || 0,
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      render: (isActive) => getStatusTag(isActive),
    },
    {
      title: "Người tạo",
      dataIndex: "createdByRole",
      key: "createdByRole",
      width: 120,
      render: (role) => {
        const roleConfig = {
          customer: { color: "blue", label: "Khách hàng" },
          admin: { color: "red", label: "Admin" },
          employee: { color: "orange", label: "Nhân viên" },
        };
        const config = roleConfig[role] || { color: "default", label: role };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    ...(canManageProductGroups
      ? [
          {
            title: "Thao tác",
            key: "actions",
            width: 200,
            fixed: "right",
            render: (_, record) => (
              <Space size={0}>
                <Tooltip title="Chỉnh sửa">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEditGroup(record)}
                  />
                </Tooltip>
                <Tooltip
                  title={record.isActive ? "Ngừng kích hoạt" : "Kích hoạt"}
                >
                  <Button
                    type="text"
                    size="small"
                    onClick={() => handleToggleStatus(record)}
                    style={{ color: !record.isActive ? "#52c41a" : "#f5222d" }}
                  >
                    {record.isActive ? "Tắt" : "Bật"}
                  </Button>
                </Tooltip>
                <Tooltip title="Xóa">
                  <Popconfirm
                    title={`Xóa "${record.name}"?`}
                    description="Bạn có chắc chắn muốn xóa nhóm sản phẩm này?"
                    onConfirm={() => handleDeleteGroup(record)}
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
      {contextHolder}
      {/* Header */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          Quản lý nhóm sản phẩm
        </Title>
        {canManageProductGroups && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateGroup}
          >
            Thêm nhóm sản phẩm
          </Button>
        )}
      </Flex>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={6}>
            <Input
              placeholder="Tìm kiếm nhóm sản phẩm..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Chọn loại"
              value={filters.type}
              onChange={(value) => handleFilterChange("type", value)}
              allowClear
              style={{ width: "100%" }}
            >
              <Option value="combo">Combo</Option>
              <Option value="pc-config">Cấu hình PC</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="Chọn trạng thái"
              value={filters.isActive}
              onChange={(value) => handleFilterChange("isActive", value)}
              allowClear
              style={{ width: "100%" }}
            >
              <Option value={true}>Đang hoạt động</Option>
              <Option value={false}>Ngừng hoạt động</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="Người tạo"
              value={filters.createdByRole}
              onChange={(value) => handleFilterChange("createdByRole", value)}
              allowClear
              style={{ width: "100%" }}
            >
              <Option value="admin,employee">Admin & Nhân viên</Option>
              <Option value="admin">Admin</Option>
              <Option value="employee">Nhân viên</Option>
              <Option value="customer">Khách hàng</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="Sắp xếp"
              value={filters.sort}
              onChange={(value) => handleFilterChange("sort", value)}
              style={{ width: "100%" }}
            >
              <Option value="newest">Mới nhất</Option>
              <Option value="oldest">Cũ nhất</Option>
              <Option value="name_asc">Tên A-Z</Option>
              <Option value="name_desc">Tên Z-A</Option>
              <Option value="views">Lượt xem</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={groups}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={false}
        />
        <div style={{ marginTop: 16, textAlign: "right" }}>
          <Pagination
            current={paginationData.current || page}
            pageSize={paginationData.pageSize || pageSize}
            total={paginationData.total || 0}
            showSizeChanger
            showTotal={(total) => `Tổng ${total} nhóm sản phẩm`}
            onChange={(newPage, newPageSize) => {
              setPage(newPage);
              setPageSize(newPageSize);
            }}
            pageSizeOptions={["10", "20", "50", "100"]}
          />
        </div>
      </Card>
    </div>
  );
};

export default ProductGroupsPage;
