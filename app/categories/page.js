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
  message,
  Popconfirm,
  Tree,
  Switch,
  Drawer,
  Row,
  Col,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BranchesOutlined,
} from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CategoryApi } from "@/apis/products";
import CategoryFormModal from "@/components/products/CategoryFormModal";
import {
  getCurrentUser,
  hasPermission,
  PERMISSIONS,
} from "@/utils/permissions";

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const CategoriesPage = () => {
  const queryClient = useQueryClient();
  const currentUser = getCurrentUser();
  const [searchText, setSearchText] = useState("");
  const [componentTypeFilter, setComponentTypeFilter] = useState(null);
  const [levelFilter, setLevelFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [treeDrawerVisible, setTreeDrawerVisible] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    pages: 0,
  });
  const [sortBy, setSortBy] = useState("sortOrder");
  const [sortOrder, setSortOrder] = useState("asc");

  const canManageCategories = hasPermission(
    currentUser,
    PERMISSIONS.MANAGE_CATEGORIES
  );

  // Query for categories
  const { data: categoriesData, isLoading: loading } = useQuery({
    queryKey: [
      "categories",
      pagination.current,
      pagination.pageSize,
      searchText,
      componentTypeFilter,
      levelFilter,
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
        componentType: componentTypeFilter || undefined,
        level: levelFilter !== null ? levelFilter : undefined,
        isActive: statusFilter !== null ? statusFilter === "active" : undefined,
      };

      // Remove undefined values
      Object.keys(params).forEach(
        (key) => params[key] === undefined && delete params[key]
      );

      const response = await CategoryApi.getAll(params);

      if (response && response.categories) {
        return {
          categories: response.categories,
          pagination: response.pagination,
        };
      } else {
        // Fallback for old API response format
        const categoriesData = response || [];
        return {
          categories: categoriesData,
          pagination: {
            current: 1,
            pageSize: categoriesData.length,
            total: categoriesData.length,
            pages: 1,
          },
        };
      }
    },
  });

  const categories = categoriesData?.categories || [];
  const paginationData = categoriesData?.pagination || {
    current: 1,
    pageSize: 20,
    total: 0,
    pages: 0,
  };

  // Query for category hierarchy
  const { data: categoryTree = [] } = useQuery({
    queryKey: ["categories", "hierarchy"],
    queryFn: async () => {
      const response = await CategoryApi.getHierarchy();
      return response || [];
    },
  });

  // Query for all categories (for parent selection)
  const { data: allCategories = [] } = useQuery({
    queryKey: ["categories", "all"],
    queryFn: async () => {
      const response = await CategoryApi.getAll({ limit: 1000, page: 1 });
      if (response && response.categories) {
        return response.categories;
      } else {
        return response || [];
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setFormModalVisible(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setFormModalVisible(true);
  };

  const handleFormSuccess = (categoryData) => {
    setFormModalVisible(false);
    setEditingCategory(null);
    // Invalidate all category-related queries to refresh data
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["categories", "all"] });
    queryClient.invalidateQueries({ queryKey: ["categories", "hierarchy"] });
  };

  const handleFormCancel = () => {
    setFormModalVisible(false);
    setEditingCategory(null);
  };

  const handleDeleteCategory = async (category) => {
    try {
      await CategoryApi.delete(category._id);
      message.success("Xóa danh mục thành công");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (error) {
      message.error(error.response?.data?.message || "Xóa danh mục thất bại");
      console.error("Error deleting category:", error);
    }
  };

  const handleToggleStatus = async (category) => {
    try {
      await CategoryApi.toggleStatus(category._id);
      message.success(
        `${
          category.isActive ? "Ngừng kích hoạt" : "Kích hoạt"
        } danh mục thành công`
      );
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (error) {
      message.error("Cập nhật trạng thái danh mục thất bại");
    }
  };

  const getComponentTypeTag = (componentType) => {
    if (!componentType) return null;

    const typeColors = {
      CPU: "blue",
      VGA: "green",
      RAM: "orange",
      Mainboard: "purple",
      Storage: "cyan",
      PSU: "red",
      Case: "brown",
      Cooling: "lime",
      Monitor: "pink",
      Keyboard: "gold",
      Mouse: "volcano",
      Headset: "magenta",
      Webcam: "geekblue",
      Audio: "magenta",
      Networking: "cyan",
      Other: "default",
    };

    return (
      <Tag color={typeColors[componentType] || "default"}>{componentType}</Tag>
    );
  };

  const getLevelTag = (level) => {
    const levelNames = ["Gốc", "Phụ", "Phụ-Phụ"];
    const levelColors = ["green", "blue", "orange"];
    return (
      <Tag color={levelColors[level] || "default"}>
        Cấp {level} ({levelNames[level] || "Sâu"})
      </Tag>
    );
  };

  const clearFilters = () => {
    setSearchText("");
    setComponentTypeFilter(null);
    setLevelFilter(null);
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

  const renderTreeNodes = (nodes) => {
    return nodes.map((node) => ({
      title: (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>
            {node.name}
            {node.componentType && (
              <Tag size="small" color="blue" style={{ marginLeft: 8 }}>
                {node.componentType}
              </Tag>
            )}
            {!node.isActive && (
              <Tag size="small" color="red">
                Ngừng hoạt động
              </Tag>
            )}
          </span>
          {canManageCategories && (
            <Space>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditCategory(node);
                }}
              />
              <Popconfirm
                title={`Xóa "${node.name}"?`}
                onConfirm={(e) => {
                  e.stopPropagation();
                  handleDeleteCategory(node);
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  danger
                />
              </Popconfirm>
            </Space>
          )}
        </div>
      ),
      key: node._id,
      children:
        node.children?.length > 0 ? renderTreeNodes(node.children) : undefined,
    }));
  };

  const columns = [
    {
      title: "Tên Danh mục",
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
        <div>
          <div style={{ fontWeight: 500 }}>
            {text}
            {!record.isActive && (
              <Tag color="red" size="small" style={{ marginLeft: 8 }}>
                Ngừng hoạt động
              </Tag>
            )}
          </div>
          {record.description && (
            <div style={{ color: "#666", fontSize: 12, marginTop: 2 }}>
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Loại Linh kiện",
      dataIndex: "componentType",
      key: "componentType",
      width: 120,
      render: (componentType) => getComponentTypeTag(componentType),
    },
    {
      title: "Cấp độ & Danh mục cha",
      key: "levelAndParent",
      width: 200,
      render: (_, record) => {
        const { level, parentId } = record;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div>{getLevelTag(level)}</div>
            <div>
              {!parentId ? (
                <Tag color="green" size="small">
                  Danh mục gốc
                </Tag>
              ) : (
                (() => {
                  const parent = allCategories.find(
                    (cat) => cat._id === parentId
                  );
                  return parent ? (
                    <Tag color="blue" size="small">
                      Cha: {parent.name}
                    </Tag>
                  ) : (
                    <Tag color="red" size="small">
                      Danh mục cha không xác định
                    </Tag>
                  );
                })()
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Thứ tự sắp xếp",
      dataIndex: "sortOrder",
      key: "sortOrder",
      width: 100,
      align: "center",
      sorter: true,
      sortOrder:
        sortBy === "sortOrder"
          ? sortOrder === "desc"
            ? "descend"
            : "ascend"
          : null,
    },
    ...(canManageCategories
      ? [
          {
            title: "Trạng thái",
            key: "status",
            width: 100,
            render: (_, record) => (
              <Switch
                checked={record.isActive}
                onChange={() => handleToggleStatus(record)}
                checkedChildren="Hoạt động"
                unCheckedChildren="Ngừng hoạt động"
              />
            ),
          },
        ]
      : []),
    ...(canManageCategories
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
                  onClick={() => handleEditCategory(record)}
                />
                <Popconfirm
                  title={`Xóa "${record.name}"?`}
                  description="Bạn có chắc chắn muốn xóa danh mục này?"
                  onConfirm={() => handleDeleteCategory(record)}
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
          Quản lý Danh mục
        </Title>
        <Space>
          <Button
            icon={<BranchesOutlined />}
            onClick={() => setTreeDrawerVisible(true)}
          >
            Xem Cây
          </Button>
          {canManageCategories && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateCategory}
            >
              Thêm Danh mục
            </Button>
          )}
        </Space>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Search
              placeholder="Tìm kiếm danh mục..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Loại linh kiện"
              value={componentTypeFilter}
              onChange={setComponentTypeFilter}
              allowClear
              style={{ width: "100%" }}
            >
              <Option value="CPU">CPU</Option>
              <Option value="VGA">VGA</Option>
              <Option value="RAM">RAM</Option>
              <Option value="Mainboard">Mainboard</Option>
              <Option value="Storage">Storage</Option>
              <Option value="PSU">PSU</Option>
              <Option value="Case">Case</Option>
              <Option value="Cooling">Cooling</Option>
              <Option value="Monitor">Monitor</Option>
              <Option value="Keyboard">Keyboard</Option>
              <Option value="Mouse">Mouse</Option>
              <Option value="Headset">Headset</Option>
              <Option value="Webcam">Webcam</Option>
              <Option value="Audio">Audio</Option>
              <Option value="Networking">Networking</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Col>
          <Col span={3}>
            <Select
              placeholder="Cấp độ"
              value={levelFilter}
              onChange={setLevelFilter}
              allowClear
              style={{ width: "100%" }}
            >
              <Option value={0}>Cấp 0 (Gốc)</Option>
              <Option value={1}>Cấp 1 (Phụ)</Option>
              <Option value={2}>Cấp 2 (Phụ-Phụ)</Option>
            </Select>
          </Col>
          <Col span={3}>
            <Select
              placeholder="Trạng thái"
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              style={{ width: "100%" }}
            >
              <Option value="active">Hoạt động</Option>
              <Option value="inactive">Ngừng hoạt động</Option>
            </Select>
          </Col>
          <Col span={3}>
            <Button onClick={clearFilters}>Xóa Bộ lọc</Button>
          </Col>
        </Row>
      </Card>

      {/* Categories Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={categories}
          loading={loading}
          rowKey="_id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: paginationData.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} danh mục`,
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
                    <strong>Thông tin Meta:</strong>
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
              !!record.description || !!record.metaTitle,
          }}
        />
      </Card>

      {/* Tree View Drawer */}
      <Drawer
        title="Cây Danh mục"
        placement="right"
        onClose={() => setTreeDrawerVisible(false)}
        open={treeDrawerVisible}
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          {canManageCategories && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateCategory}
              block
            >
              Thêm Danh mục mới
            </Button>
          )}
        </div>
        <Tree
          treeData={renderTreeNodes(categoryTree)}
          defaultExpandAll
          showLine
        />
      </Drawer>

      {/* Category Form Modal */}
      <CategoryFormModal
        visible={formModalVisible}
        onCancel={handleFormCancel}
        onSuccess={handleFormSuccess}
        category={editingCategory}
        categories={allCategories}
      />
    </div>
  );
};

export default CategoriesPage;
