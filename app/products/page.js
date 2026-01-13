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
  Alert,
  Checkbox,
  Dropdown,
  Menu,
  Divider,
  Image,
  Flex,
  Row,
  Col,
  message,
  Popconfirm,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FilterOutlined,
  StarOutlined,
  StarFilled,
  AppstoreOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ProductApi, CategoryApi, BrandApi } from "@/apis/products";
import ProductFormModal from "@/components/products/ProductFormModal";
import PermissionWrapper from "@/components/common/PermissionWrapper";
import {
  getCurrentUser,
  hasPermission,
  PERMISSIONS,
} from "@/utils/permissions";
import {
  getColorOptions,
  getColorName,
  PRODUCT_COLORS,
} from "@/config/productColors";

const { Title } = Typography;
const { Option } = Select;

const ProductsPage = () => {
  const queryClient = useQueryClient();
  const currentUser = getCurrentUser();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({
    search: "",
    brandId: null,
    categoryId: null,
    status: null,
    colors: null,
    useCases: null,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const canCreateProducts = hasPermission(
    currentUser,
    PERMISSIONS.CREATE_PRODUCTS
  );
  const canEditProducts = hasPermission(currentUser, PERMISSIONS.EDIT_PRODUCTS);
  const canDeleteProducts = hasPermission(
    currentUser,
    PERMISSIONS.DELETE_PRODUCTS
  );

  // Query for products
  const { data: productsData, isLoading: loading } = useQuery({
    queryKey: ["products", page, pageSize, filters],
    queryFn: async () => {
      const params = { page, limit: pageSize, ...filters };

      // Handle colors filter - convert array to comma-separated string if needed
      if (
        params.colors &&
        Array.isArray(params.colors) &&
        params.colors.length > 0
      ) {
        params.colors = params.colors.join(",");
      }

      // Handle useCases filter - convert array to comma-separated string if needed
      if (
        params.useCases &&
        Array.isArray(params.useCases) &&
        params.useCases.length > 0
      ) {
        params.useCases = params.useCases.join(",");
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

      const response = await ProductApi.getAll(params);
      return {
        products: response.products || [],
        total: response.pagination?.total || 0,
      };
    },
  });

  const products = productsData?.products || [];
  const total = productsData?.total || 0;

  // Query for categories
  const { data: categoriesData } = useQuery({
    queryKey: ["categories", "products-page"],
    queryFn: async () => {
      const response = await CategoryApi.getAll({ isActive: true, limit: 100 });
      return response?.categories || [];
    },
  });

  const categories = categoriesData || [];

  // Query for brands
  const { data: brandsData } = useQuery({
    queryKey: ["brands", "products-page"],
    queryFn: async () => {
      const response = await BrandApi.getAll({ isActive: true, limit: 100 });
      return response?.brands || [];
    },
  });

  const brands = brandsData || [];

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setFormModalVisible(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormModalVisible(true);
  };

  const handleFormSuccess = () => {
    setFormModalVisible(false);
    setEditingProduct(null);
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const handleFormCancel = () => {
    setFormModalVisible(false);
    setEditingProduct(null);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      brandId: "",
      categoryId: "",
      status: "",
      colors: null,
      useCases: null,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    setPage(1);
  };

  const handleDeleteProduct = async (product) => {
    try {
      await ProductApi.delete(product._id);
      message.success("Xóa sản phẩm thành công");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (error) {
      message.error("Xóa sản phẩm thất bại");
      console.error("Error deleting product:", error);
    }
  };

  const handleToggleStatus = async (product) => {
    try {
      await ProductApi.toggleStatus(product._id);
      message.success(
        `Sản phẩm ${
          product.isActive ? "đã ngừng kích hoạt" : "đã kích hoạt"
        } thành công`
      );
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (error) {
      message.error("Cập nhật trạng thái sản phẩm thất bại");
    }
  };

  const handleToggleFeatured = async (product) => {
    try {
      await ProductApi.toggleFeatured(product._id);
      message.success(
        `Sản phẩm ${
          product.isFeatured ? "đã hủy nổi bật" : "đã đặt nổi bật"
        } thành công`
      );
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (error) {
      message.error("Cập nhật trạng thái nổi bật thất bại");
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedRowKeys.length === 0) return;

    try {
      if (action === "delete") {
        await ProductApi.bulkDelete({ productIds: selectedRowKeys });
        message.success(`Đã xóa ${selectedRowKeys.length} sản phẩm thành công`);
      } else if (action === "activate") {
        await ProductApi.bulkUpdateStatus({
          productIds: selectedRowKeys,
          isActive: true,
        });
        message.success(
          `Đã kích hoạt ${selectedRowKeys.length} sản phẩm thành công`
        );
      } else if (action === "deactivate") {
        await ProductApi.bulkUpdateStatus({
          productIds: selectedRowKeys,
          isActive: false,
        });
        message.success(
          `Đã ngừng kích hoạt ${selectedRowKeys.length} sản phẩm thành công`
        );
      }

      setSelectedRowKeys([]);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (error) {
      message.error("Thực hiện thao tác nhiều thất bại");
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getStatusTag = (product) => {
    if (!product.isActive) {
      return <Tag color="red">Ngừng hoạt động</Tag>;
    }

    const statusColors = {
      published: "green",
      draft: "orange",
      discontinued: "red",
      "coming-soon": "blue",
    };

    const statusLabels = {
      published: "Đã xuất bản",
      draft: "Nháp",
      discontinued: "Ngừng kinh doanh",
      "coming-soon": "Sắp ra mắt",
    };

    return (
      <Tag color={statusColors[product.status] || "default"}>
        {statusLabels[product.status] || product.status}
      </Tag>
    );
  };

  const bulkActionMenuItems = [];

  if (canEditProducts) {
    bulkActionMenuItems.push(
      {
        key: "activate",
        label: "Kích hoạt các sản phẩm đã chọn",
        onClick: () => handleBulkAction("activate"),
      },
      {
        key: "deactivate",
        label: "Ngừng kích hoạt các sản phẩm đã chọn",
        onClick: () => handleBulkAction("deactivate"),
      }
    );
  }

  if (canDeleteProducts) {
    if (bulkActionMenuItems.length > 0) {
      bulkActionMenuItems.push({ type: "divider" });
    }
    bulkActionMenuItems.push({
      key: "delete",
      label: "Xóa các sản phẩm đã chọn",
      danger: true,
      onClick: () => handleBulkAction("delete"),
    });
  }

  const bulkActionMenu = <Menu items={bulkActionMenuItems} />;

  const columns = [
    {
      title: (
        <Tooltip title="Hình ảnh sản phẩm">
          <span>Hình ảnh</span>
        </Tooltip>
      ),
      key: "image",
      width: 100,
      fixed: "left",
      render: (_, record) => (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {record.images?.[0]?.url ? (
            <Image
              src={record.images[0].url}
              alt={record.name}
              width={60}
              height={60}
              style={{ borderRadius: 4, objectFit: "cover" }}
              preview={true}
            />
          ) : (
            <div
              style={{
                width: 60,
                height: 60,
                backgroundColor: "#f0f0f0",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#999",
                fontSize: 12,
              }}
            >
              Chưa có
            </div>
          )}
        </div>
      ),
    },
    {
      title: (
        <Tooltip title="Thông tin sản phẩm bao gồm tên và mô tả ngắn">
          <span>Sản phẩm</span>
        </Tooltip>
      ),
      dataIndex: "name",
      key: "name",
      width: 350,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 2 }}>
            {record.name}
            {record.isFeatured && (
              <StarFilled
                style={{ color: "#faad14", marginLeft: 8, fontSize: 14 }}
              />
            )}
          </div>
        </div>
      ),
    },
    {
      title: (
        <Tooltip title="Mã định danh duy nhất của sản phẩm">
          <span>SKU</span>
        </Tooltip>
      ),
      dataIndex: "sku",
      key: "sku",
      width: 120,
    },
    {
      title: (
        <Tooltip title="Thương hiệu sản xuất sản phẩm">
          <span>Thương hiệu</span>
        </Tooltip>
      ),
      dataIndex: ["brandId", "name"],
      key: "brand",
      width: 100,
    },
    {
      title: (
        <Tooltip title="Danh mục sản phẩm thuộc về">
          <span>Danh mục</span>
        </Tooltip>
      ),
      dataIndex: ["categoryId", "name"],
      key: "category",
      width: 120,
    },
    {
      title: (
        <Tooltip title="Giá sản phẩm (giá khuyến mãi nếu có)">
          <span>Giá</span>
        </Tooltip>
      ),
      key: "price",
      width: 150,
      render: (_, record) => (
        <div>
          {record.pricing?.isOnSale ? (
            <>
              <div style={{ color: "#f5222d", fontWeight: 500 }}>
                {formatPrice(record.pricing.salePrice)}
              </div>
              <div
                style={{
                  textDecoration: "line-through",
                  color: "#999",
                  fontSize: 12,
                }}
              >
                {formatPrice(record.pricing.originalPrice)}
              </div>
            </>
          ) : (
            <div style={{ fontWeight: 500 }}>
              {formatPrice(record.pricing?.originalPrice)}
            </div>
          )}
        </div>
      ),
    },
    {
      title: (
        <Tooltip title="Màu sắc của sản phẩm">
          <span>Màu sắc</span>
        </Tooltip>
      ),
      key: "colors",
      width: 150,
      render: (_, record) => {
        if (!record.colors || record.colors.length === 0) {
          return <span style={{ color: "#999" }}>Chưa có</span>;
        }
        return (
          <Space wrap size={[4, 4]}>
            {record.colors.map((colorValue, index) => {
              const color = PRODUCT_COLORS.find((c) => c.value === colorValue);
              if (!color) return null;
              return (
                <Tag
                  key={index}
                  style={{
                    margin: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 8px",
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      backgroundColor: color.hex,
                      border: "1px solid #d9d9d9",
                      borderRadius: 2,
                      display: "inline-block",
                    }}
                  />
                  {color.name}
                </Tag>
              );
            })}
          </Space>
        );
      },
    },
    {
      title: (
        <Tooltip title="Số lượng tồn kho hiện tại">
          <span>Tồn kho</span>
        </Tooltip>
      ),
      key: "stock",
      width: 80,
      render: (_, record) => (
        <Tag color={record.inventory?.isInStock ? "green" : "red"}>
          {record.inventory?.stock || 0}
        </Tag>
      ),
    },
    {
      title: (
        <Tooltip title="Trạng thái xuất bản và kích hoạt">
          <span>Trạng thái</span>
        </Tooltip>
      ),
      key: "status",
      width: 100,
      render: (_, record) => getStatusTag(record),
    },
    {
      title: (
        <Tooltip title="Các thao tác có thể thực hiện với sản phẩm">
          <span>Thao tác</span>
        </Tooltip>
      ),
      key: "actions",
      width: 200,
      fixed: "right",
      render: (_, record) => (
        <Space size={0}>
          <Tooltip title="Xem chi tiết sản phẩm">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                // TODO: Implement product detail view
                message.info("Tính năng xem chi tiết đang được phát triển");
              }}
            />
          </Tooltip>

          {canEditProducts && (
            <>
              <Tooltip title="Chỉnh sửa sản phẩm">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEditProduct(record)}
                />
              </Tooltip>

              <Tooltip
                title={
                  record.isFeatured
                    ? "Hủy sản phẩm nổi bật"
                    : "Đặt sản phẩm nổi bật"
                }
              >
                <Button
                  type="text"
                  size="small"
                  icon={
                    record.isFeatured ? (
                      <StarFilled style={{ color: "#faad14" }} />
                    ) : (
                      <StarOutlined />
                    )
                  }
                  onClick={() => handleToggleFeatured(record)}
                />
              </Tooltip>

              <Tooltip
                title={
                  record.isActive
                    ? "Ngừng kích hoạt sản phẩm"
                    : "Kích hoạt sản phẩm"
                }
              >
                <Button
                  type="text"
                  size="small"
                  icon={<AppstoreOutlined />}
                  style={{ color: record.isActive ? "#52c41a" : "#f5222d" }}
                  onClick={() => handleToggleStatus(record)}
                />
              </Tooltip>
            </>
          )}

          {canDeleteProducts && (
            <Tooltip title="Xóa sản phẩm">
              <Popconfirm
                title={`Xóa "${record.name}"?`}
                description="Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác."
                onConfirm={() => handleDeleteProduct(record)}
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
          )}
        </Space>
      ),
    },
  ];

  const rowSelection =
    canEditProducts || canDeleteProducts
      ? {
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }
      : null;

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          Quản lý sản phẩm
        </Title>
        {canCreateProducts && (
          <Tooltip title="Tạo sản phẩm mới">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateProduct}
            >
              Thêm sản phẩm
            </Button>
          </Tooltip>
        )}
      </Flex>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={6}>
            <Tooltip title="Tìm kiếm theo tên sản phẩm, SKU hoặc mô tả">
              <Input
                placeholder="Tìm kiếm sản phẩm..."
                prefix={<SearchOutlined />}
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                allowClear
              />
            </Tooltip>
          </Col>
          <Col span={3}>
            <Tooltip title="Lọc sản phẩm theo thương hiệu">
              <Select
                placeholder="Chọn thương hiệu"
                value={filters.brandId}
                onChange={(value) => handleFilterChange("brandId", value)}
                allowClear
                style={{ width: "100%" }}
                showSearch
                filterOption={(input, option) =>
                  option?.children.toLowerCase().includes(input.toLowerCase())
                }
                dropdownStyle={{ minWidth: 300 }}
              >
                {brands.map((brand) => (
                  <Option key={brand._id} value={brand._id}>
                    {brand.name}
                  </Option>
                ))}
              </Select>
            </Tooltip>
          </Col>
          <Col span={3}>
            <Tooltip title="Lọc sản phẩm theo danh mục">
              <Select
                placeholder="Chọn danh mục"
                value={filters.categoryId}
                onChange={(value) => handleFilterChange("categoryId", value)}
                allowClear
                style={{ width: "100%" }}
                showSearch
                filterOption={(input, option) =>
                  option?.children.toLowerCase().includes(input.toLowerCase())
                }
                dropdownStyle={{ minWidth: 300 }}
              >
                {categories.map((category) => (
                  <Option key={category._id} value={category._id}>
                    {category.name}
                  </Option>
                ))}
              </Select>
            </Tooltip>
          </Col>
          <Col span={3}>
            <Tooltip title="Lọc sản phẩm theo màu sắc">
              <Select
                mode="multiple"
                placeholder="Chọn màu sắc"
                value={filters.colors}
                onChange={(value) => handleFilterChange("colors", value)}
                allowClear
                style={{ width: "100%" }}
                dropdownStyle={{ minWidth: 300 }}
                maxTagCount="responsive"
                options={getColorOptions()}
                optionRender={(option) => (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        backgroundColor: option.data.color.hex,
                        border: "1px solid #d9d9d9",
                        borderRadius: 2,
                        flexShrink: 0,
                      }}
                    />
                    <span>{option.data.color.name}</span>
                  </div>
                )}
              />
            </Tooltip>
          </Col>
          <Col span={3}>
            <Tooltip title="Lọc sản phẩm theo nhu cầu sử dụng">
              <Select
                mode="multiple"
                placeholder="Chọn nhu cầu"
                value={filters.useCases}
                onChange={(value) => handleFilterChange("useCases", value)}
                allowClear
                style={{ width: "100%" }}
                maxTagCount="responsive"
                dropdownStyle={{ minWidth: 300 }}
              >
                <Option value="Gaming">Gaming</Option>
                <Option value="Văn phòng">Văn phòng</Option>
                <Option value="Đồ họa - Kỹ thuật">Đồ họa - Kỹ thuật</Option>
                <Option value="Doanh nghiệp">Doanh nghiệp</Option>
                <Option value="Học sinh - Sinh viên">
                  Học sinh - Sinh viên
                </Option>
                <Option value="Streaming">Streaming</Option>
                <Option value="Mining">Mining</Option>
                <Option value="Server">Server</Option>
              </Select>
            </Tooltip>
          </Col>
          <Col span={3}>
            <Tooltip title="Lọc sản phẩm theo trạng thái xuất bản">
              <Select
                placeholder="Trạng thái"
                value={filters.status}
                onChange={(value) => handleFilterChange("status", value)}
                allowClear
                style={{ width: "100%" }}
                dropdownStyle={{ minWidth: 300 }}
              >
                <Option value="published">Đã xuất bản</Option>
                <Option value="draft">Nháp</Option>
                <Option value="discontinued">Ngừng kinh doanh</Option>
                <Option value="coming-soon">Sắp ra mắt</Option>
              </Select>
            </Tooltip>
          </Col>
          <Col span={3}>
            <Tooltip title="Xóa tất cả bộ lọc và đặt lại về mặc định">
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

        {/* Bulk Actions */}
        {selectedRowKeys.length > 0 &&
          (canEditProducts || canDeleteProducts) && (
            <Row
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTop: "1px solid #f0f0f0",
              }}
            >
              <Col>
                <Space>
                  <span>{selectedRowKeys.length} đã chọn</span>
                  <Tooltip title="Thực hiện thao tác trên các sản phẩm đã chọn">
                    <Dropdown overlay={bulkActionMenu} trigger={["click"]}>
                      <Button>
                        Thao tác nhiều <MoreOutlined />
                      </Button>
                    </Dropdown>
                  </Tooltip>
                </Space>
              </Col>
            </Row>
          )}
      </Card>

      {/* Products Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={products}
          loading={loading}
          rowKey="_id"
          rowSelection={rowSelection}
          pagination={false}
          scroll={{ x: 1500 }}
        />

        {/* Pagination */}
        <Flex justify="center" style={{ marginTop: 16 }}>
          <Tooltip title="Điều hướng trang và thay đổi số lượng hiển thị">
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              showSizeChanger
              showQuickJumper
              showTotal={(total, range) =>
                `${range[0]}-${range[1]} của ${total} sản phẩm`
              }
              onChange={(newPage, newPageSize) => {
                setPage(newPage);
                setPageSize(newPageSize);
              }}
            />
          </Tooltip>
        </Flex>
      </Card>

      {/* Product Form Modal */}
      <ProductFormModal
        visible={formModalVisible}
        onCancel={handleFormCancel}
        onSuccess={handleFormSuccess}
        product={editingProduct}
        categories={categories}
        brands={brands}
      />
    </div>
  );
};

export default ProductsPage;
