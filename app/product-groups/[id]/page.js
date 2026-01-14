"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Typography,
  Tag,
  Space,
  message,
  Spin,
  Descriptions,
  Table,
  Row,
  Col,
  Divider,
  Alert,
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  Popconfirm,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { ProductGroupApi, ProductApi, CategoryApi } from "@/apis/products";
import SearchableSelect from "@/components/common/SearchableSelect";
import { formatPrice } from "@/utils/format";
import { getCurrentUser } from "@/utils/permissions";

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ProductGroupDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id;
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const isCreateMode = groupId === "new";
  const [isEditMode, setIsEditMode] = useState(isCreateMode);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [editingProductIndex, setEditingProductIndex] = useState(null);
  const [editingQuantity, setEditingQuantity] = useState(1);
  const [productOptions, setProductOptions] = useState([]);
  const [productsLoaded, setProductsLoaded] = useState(false);

  // Query product group (only if not create mode)
  const { data: group, isLoading: loadingGroup } = useQuery({
    queryKey: ["product-group", groupId],
    queryFn: async () => {
      const response = await ProductGroupApi.getById(groupId);
      return response?.data || response;
    },
    enabled: !!groupId && !isCreateMode,
  });

  // Query root categories
  const { data: rootCategoriesData } = useQuery({
    queryKey: ["root-categories"],
    queryFn: async () => {
      const response = await CategoryApi.getRootCategories({
        isActive: true,
      });
      return response?.categories || response || [];
    },
  });

  const rootCategories = rootCategoriesData || [];

  // Load form data when in edit mode
  useEffect(() => {
    if (isEditMode && group) {
      form.setFieldsValue({
        name: group.name,
        description: group.description,
        shortDescription: group.shortDescription,
        type: group.type,
        isActive: group.isActive,
        tags: group.tags?.join(", ") || "",
      });
      setProductsLoaded(false);
    } else if (isCreateMode) {
      form.resetFields();
      setProducts([]);
      setProductsLoaded(false);
    }
  }, [isEditMode, group, isCreateMode, form]);

  // Load products separately when form is loaded and root categories are available
  useEffect(() => {
    if (!isEditMode || !group || productsLoaded) return;

    // Only load if we have root categories OR all products already have categoryLevel0Id
    const needsCategoryLevel0 = group.products?.some(
      (item) => !item.categoryLevel0Id
    );
    if (needsCategoryLevel0 && rootCategories.length === 0) return;

    const loadProducts = async () => {
      const productItems = group.products || [];
      const loadedProducts = await Promise.all(
        productItems.map(async (item) => {
          const productId = item.productId?._id || item.productId;
          let product = item.productId;
          let categoryLevel0Id = item.categoryLevel0Id || null;

          // If product is not fully populated, fetch it
          if (!product || !product.name) {
            try {
              const response = await ProductApi.getById(productId);
              product = response;
            } catch (error) {
              console.error("Error loading product:", error);
            }
          }

          // If categoryLevel0Id is not set, find it from product's category
          if (!categoryLevel0Id && product && rootCategories.length > 0) {
            const productCategoryId =
              product.categoryId?._id || product.categoryId;
            if (productCategoryId) {
              categoryLevel0Id = await findCategoryLevel0(productCategoryId);
            }
          }

          return {
            productId,
            product,
            quantity: item.quantity || 1,
            categoryLevel0Id,
          };
        })
      );
      setProducts(loadedProducts);
      setProductsLoaded(true);
    };

    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, group?._id, rootCategories.length]);

  // Helper function to find category level 0
  const findCategoryLevel0 = async (categoryId) => {
    if (!categoryId) return null;

    try {
      const categoryIdStr = String(categoryId);

      // First check if it's already a root category
      const rootCategory = rootCategories.find(
        (cat) => String(cat._id) === categoryIdStr
      );
      if (rootCategory) {
        return rootCategory._id;
      }

      // If not root, fetch category and traverse up to find root
      const category = await CategoryApi.getById(categoryId);
      if (!category) return null;

      // If level is 0, return it
      if (category.level === 0) {
        return category._id;
      }

      // Traverse up the parent chain
      let currentCategory = category;
      while (currentCategory && currentCategory.parentId) {
        const parentCategory = await CategoryApi.getById(
          currentCategory.parentId
        );
        if (!parentCategory) break;

        if (parentCategory.level === 0) {
          return parentCategory._id;
        }
        currentCategory = parentCategory;
      }

      return null;
    } catch (error) {
      console.error("Error finding category level 0:", error);
      return null;
    }
  };

  // Fetch products for searchable select
  const fetchProducts = async ({ search = "" }) => {
    try {
      const params = {
        isActive: true,
        status: "published",
        limit: 50,
        ...(search && { search }),
      };
      const response = await ProductApi.getAll(params);
      const productList = response?.products || [];
      setProductOptions(productList);
      return productList;
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  };

  const handleProductSelect = async (productId) => {
    if (!productId) return;

    // Find product from options
    const product = productOptions.find((p) => p._id === productId);
    if (!product) {
      messageApi.warning("Không tìm thấy sản phẩm");
      return;
    }

    await handleAddProduct(productId, product);

    // Clear selection
    form.setFieldsValue({ selectedProduct: undefined });
  };

  const handleAddProduct = async (productId, product) => {
    if (!productId || !product) {
      messageApi.warning("Vui lòng chọn sản phẩm");
      return;
    }

    // Find category level 0 for this product
    let categoryLevel0Id = null;
    const productCategoryId = product.categoryId?._id || product.categoryId;
    if (productCategoryId) {
      categoryLevel0Id = await findCategoryLevel0(productCategoryId);
    }

    // Check if product already exists
    const existingIndex = products.findIndex((p) => p.productId === productId);
    if (existingIndex >= 0) {
      messageApi.warning("Sản phẩm đã có trong nhóm");
      return;
    }

    setProducts([
      ...products,
      {
        productId,
        product,
        quantity: 1,
        categoryLevel0Id,
      },
    ]);
    messageApi.success("Đã thêm sản phẩm vào nhóm");
  };

  const handleRemoveProduct = (index) => {
    setProducts(products.filter((_, i) => i !== index));
    messageApi.success("Đã xóa sản phẩm khỏi nhóm");
  };

  const handleUpdateQuantity = (index, quantity) => {
    if (quantity < 1) {
      messageApi.warning("Số lượng phải lớn hơn 0");
      return;
    }
    const updatedProducts = [...products];
    updatedProducts[index].quantity = quantity;
    setProducts(updatedProducts);
    setEditingProductIndex(null);
  };

  const handleStartEditQuantity = (index) => {
    setEditingProductIndex(index);
    setEditingQuantity(products[index].quantity);
  };

  const handleCancelEditQuantity = () => {
    setEditingProductIndex(null);
    setEditingQuantity(1);
  };

  const calculateFormTotalPrice = () => {
    return products.reduce((total, item) => {
      const product = item.product;
      if (!product || !product.pricing) return total;

      const price =
        product.pricing.isOnSale && product.pricing.salePrice
          ? product.pricing.salePrice
          : product.pricing.originalPrice || 0;

      return total + price * (item.quantity || 1);
    }, 0);
  };

  const calculateFormOriginalTotalPrice = () => {
    return products.reduce((total, item) => {
      const product = item.product;
      if (!product || !product.pricing) return total;
      return (
        total + (product.pricing.originalPrice || 0) * (item.quantity || 1)
      );
    }, 0);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (products.length === 0) {
        messageApi.warning("Vui lòng thêm ít nhất một sản phẩm vào nhóm");
        return;
      }

      setLoading(true);

      // Get current user role (admin or employee)
      const currentUser = getCurrentUser();
      const userRole = currentUser?.role || "admin";

      const data = {
        name: values.name,
        description: values.description,
        shortDescription: values.shortDescription,
        type: values.type || "pc-config",
        isActive: values.isActive !== undefined ? values.isActive : true,
        tags: values.tags
          ? values.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
        products: products.map((item) => ({
          productId: item.productId,
          categoryLevel0Id: item.categoryLevel0Id || null,
          quantity: item.quantity,
        })),
        role: userRole, // Send role to backend
      };

      let savedGroup;
      if (isCreateMode) {
        const response = await ProductGroupApi.create(data);
        savedGroup = response?.data || response;
        messageApi.success("Tạo nhóm sản phẩm thành công");
      } else {
        await ProductGroupApi.update(groupId, data);
        messageApi.success("Cập nhật nhóm sản phẩm thành công");
        savedGroup = { ...group, ...data };
      }

      queryClient.invalidateQueries({ queryKey: ["product-groups"] });
      if (isCreateMode) {
        router.push(`/product-groups/${savedGroup._id}`);
      } else {
        queryClient.invalidateQueries({ queryKey: ["product-group", groupId] });
        setIsEditMode(false);
      }
    } catch (error) {
      console.error("Error saving product group:", error);
      messageApi.error(
        isCreateMode
          ? "Tạo nhóm sản phẩm thất bại"
          : "Cập nhật nhóm sản phẩm thất bại"
      );
    } finally {
      setLoading(false);
    }
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await ProductGroupApi.delete(groupId);
    },
    onSuccess: () => {
      messageApi.success("Xóa nhóm sản phẩm thành công");
      queryClient.invalidateQueries({ queryKey: ["product-groups"] });
      router.push("/product-groups");
    },
    onError: () => {
      messageApi.error("Xóa nhóm sản phẩm thất bại");
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async () => {
      return await ProductGroupApi.toggleStatus(groupId);
    },
    onSuccess: () => {
      messageApi.success("Cập nhật trạng thái thành công");
      queryClient.invalidateQueries({ queryKey: ["product-group", groupId] });
      queryClient.invalidateQueries({ queryKey: ["product-groups"] });
    },
    onError: () => {
      messageApi.error("Cập nhật trạng thái thất bại");
    },
  });

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancel = () => {
    if (isCreateMode) {
      router.push("/product-groups");
    } else {
      setIsEditMode(false);
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const handleToggleStatus = () => {
    toggleStatusMutation.mutate();
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

  // Calculate total price for view mode
  const calculateTotalPrice = () => {
    if (!group?.products || group.products.length === 0) return 0;

    return group.products.reduce((total, item) => {
      const product = item.productId;
      if (!product?.pricing) return total;

      const price =
        product.pricing.isOnSale && product.pricing.salePrice
          ? product.pricing.salePrice
          : product.pricing.originalPrice || 0;

      const quantity = item.quantity || 1;
      return total + price * quantity;
    }, 0);
  };

  // Product columns for form table
  const formProductColumns = [
    {
      title: "Sản phẩm",
      key: "product",
      width: 300,
      render: (_, record) => {
        const product = record.product;
        if (!product) return <span>Đang tải...</span>;

        return (
          <div>
            <div style={{ fontWeight: 500 }}>{product.name}</div>
            <div style={{ fontSize: 12, color: "#999" }}>
              SKU: {product.sku}
            </div>
            {product.brandId && (
              <Tag style={{ marginTop: 4 }}>{product.brandId.name}</Tag>
            )}
          </div>
        );
      },
    },
    {
      title: "Giá",
      key: "price",
      width: 150,
      render: (_, record) => {
        const product = record.product;
        if (!product || !product.pricing) return "-";

        const price =
          product.pricing.isOnSale && product.pricing.salePrice
            ? product.pricing.salePrice
            : product.pricing.originalPrice || 0;

        return (
          <div>
            <div style={{ fontWeight: 500 }}>{formatPrice(price)}</div>
            {product.pricing.isOnSale && (
              <div
                style={{
                  textDecoration: "line-through",
                  color: "#999",
                  fontSize: 12,
                }}
              >
                {formatPrice(product.pricing.originalPrice)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Số lượng",
      key: "quantity",
      width: 150,
      render: (_, record, index) => {
        if (editingProductIndex === index) {
          return (
            <Space>
              <InputNumber
                min={1}
                max={100}
                value={editingQuantity}
                onChange={(value) => setEditingQuantity(value)}
                style={{ width: 80 }}
              />
              <Button
                type="link"
                size="small"
                onClick={() => handleUpdateQuantity(index, editingQuantity)}
              >
                Lưu
              </Button>
              <Button
                type="link"
                size="small"
                onClick={handleCancelEditQuantity}
              >
                Hủy
              </Button>
            </Space>
          );
        }

        return (
          <Space>
            <span>{record.quantity}</span>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleStartEditQuantity(index)}
            />
          </Space>
        );
      },
    },
    {
      title: "Thành tiền",
      key: "subtotal",
      width: 150,
      render: (_, record) => {
        const product = record.product;
        if (!product || !product.pricing) return "-";

        const price =
          product.pricing.isOnSale && product.pricing.salePrice
            ? product.pricing.salePrice
            : product.pricing.originalPrice || 0;

        return (
          <div style={{ fontWeight: 500 }}>
            {formatPrice(price * (record.quantity || 1))}
          </div>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 100,
      render: (_, record, index) => (
        <Popconfirm
          title="Xóa sản phẩm khỏi nhóm?"
          onConfirm={() => handleRemoveProduct(index)}
          okText="Có"
          cancelText="Không"
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  // Product columns for view mode
  const viewProductColumns = [
    {
      title: "Sản phẩm",
      key: "product",
      width: 300,
      render: (_, item) => {
        const product = item.productId;
        if (!product) return "-";
        return (
          <div>
            <div style={{ fontWeight: 500 }}>{product.name}</div>
            {product.sku && (
              <div style={{ fontSize: 12, color: "#999" }}>
                SKU: {product.sku}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Danh mục gốc",
      key: "categoryLevel0",
      width: 150,
      render: (_, item) => {
        const category = item.categoryLevel0Id;
        if (!category) return "-";
        return category.name || "-";
      },
    },
    {
      title: "Giá",
      key: "price",
      width: 150,
      render: (_, item) => {
        const product = item.productId;
        if (!product?.pricing) return "-";

        const price =
          product.pricing.isOnSale && product.pricing.salePrice
            ? product.pricing.salePrice
            : product.pricing.originalPrice || 0;

        return (
          <div>
            {product.pricing.isOnSale && (
              <div
                style={{
                  textDecoration: "line-through",
                  color: "#999",
                  fontSize: 12,
                }}
              >
                {formatPrice(product.pricing.originalPrice)}
              </div>
            )}
            <div style={{ fontWeight: 500, color: "#f5222d" }}>
              {formatPrice(price)}
            </div>
          </div>
        );
      },
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      align: "center",
    },
    {
      title: "Thành tiền",
      key: "subtotal",
      width: 150,
      render: (_, item) => {
        const product = item.productId;
        if (!product?.pricing) return "-";

        const price =
          product.pricing.isOnSale && product.pricing.salePrice
            ? product.pricing.salePrice
            : product.pricing.originalPrice || 0;

        const quantity = item.quantity || 1;
        const subtotal = price * quantity;

        return <div style={{ fontWeight: 500 }}>{formatPrice(subtotal)}</div>;
      },
    },
  ];

  const totalPrice = calculateFormTotalPrice();
  const originalTotalPrice = calculateFormOriginalTotalPrice();
  const discountPercent =
    originalTotalPrice > 0
      ? Math.round(
          ((originalTotalPrice - totalPrice) / originalTotalPrice) * 100
        )
      : 0;

  // Show form if in create mode or edit mode
  if (isCreateMode || isEditMode) {
    return (
      <div style={{ padding: 24 }}>
        {contextHolder}
        <Button icon={<ArrowLeftOutlined />} onClick={handleCancel}>
          Quay lại
        </Button>
        <Title level={2} style={{ margin: 0 }} className="!my-4">
          {isCreateMode ? "Tạo nhóm sản phẩm mới" : "Chỉnh sửa nhóm sản phẩm"}
        </Title>
        <Card>
          <Form form={form} layout="vertical" className="!space-y-4">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Tên nhóm sản phẩm"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập tên nhóm sản phẩm",
                    },
                    { min: 2, message: "Tên phải có ít nhất 2 ký tự" },
                  ]}
                >
                  <Input placeholder="Ví dụ: Gaming PC Build 2024" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="shortDescription"
                  label="Mô tả ngắn"
                  rules={[{ max: 500, message: "Tối đa 500 ký tự" }]}
                >
                  <Input placeholder="Mô tả ngắn về nhóm sản phẩm" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="Mô tả chi tiết"
              rules={[{ max: 2000, message: "Tối đa 2000 ký tự" }]}
            >
              <TextArea
                rows={3}
                placeholder="Mô tả chi tiết về nhóm sản phẩm..."
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="type"
                  label="Loại"
                  initialValue="pc-config"
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Option value="combo">Combo</Option>
                    <Option value="pc-config">Cấu hình PC</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="tags" label="Tags (phân cách bằng dấu phẩy)">
                  <Input placeholder="gaming, pc-build, high-end" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="isActive"
                  label="Kích hoạt"
                  valuePropName="checked"
                  initialValue={true}
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left">Danh sách sản phẩm</Divider>

            <div style={{ marginBottom: 16 }}>
              <Form.Item name="selectedProduct" noStyle>
                <SearchableSelect
                  fetchData={fetchProducts}
                  labelField="name"
                  valueField="_id"
                  placeholder="Tìm và chọn sản phẩm..."
                  showSearch={true}
                  minSearchLength={1}
                  style={{ width: "100%" }}
                  onChange={handleProductSelect}
                  allowClear
                />
              </Form.Item>
            </div>

            {products.length > 0 ? (
              <>
                <Table
                  columns={formProductColumns}
                  dataSource={products}
                  rowKey={(record, index) => `${record.productId}-${index}`}
                  pagination={false}
                  size="small"
                />

                <Divider />

                <Row gutter={16} style={{ marginTop: 16 }}>
                  <Col span={12}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ color: "#999" }}>Tổng giá gốc: </span>
                        <span style={{ textDecoration: "line-through" }}>
                          {formatPrice(originalTotalPrice)}
                        </span>
                      </div>
                      {discountPercent > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          <Tag color="red">Giảm {discountPercent}%</Tag>
                        </div>
                      )}
                      <div style={{ fontSize: 18, fontWeight: 600 }}>
                        <span style={{ color: "#999" }}>Tổng cộng: </span>
                        <span style={{ color: "#f5222d", fontSize: 20 }}>
                          {formatPrice(totalPrice)}
                        </span>
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div>
                      <div>
                        <ShoppingCartOutlined /> {products.length} sản phẩm
                      </div>
                      <div>
                        Tổng số lượng:{" "}
                        {products.reduce(
                          (sum, p) => sum + (p.quantity || 1),
                          0
                        )}
                      </div>
                    </div>
                  </Col>
                </Row>
              </>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: 40,
                  color: "#999",
                  border: "1px dashed #d9d9d9",
                  borderRadius: 4,
                }}
              >
                Chưa có sản phẩm nào. Vui lòng thêm sản phẩm vào nhóm.
              </div>
            )}
          </Form>

          <div style={{ marginTop: 24, textAlign: "right" }}>
            <Space>
              <Button onClick={handleCancel}>Hủy</Button>
              <Button type="primary" onClick={handleSubmit} loading={loading}>
                {isCreateMode ? "Tạo mới" : "Cập nhật"}
              </Button>
            </Space>
          </div>
        </Card>
      </div>
    );
  }

  if (loadingGroup) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!group) {
    return (
      <div style={{ padding: "24px" }}>
        <Card>
          <Alert
            message="Không tìm thấy nhóm sản phẩm"
            description="Nhóm sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã bị xóa."
            type="error"
            showIcon
            action={
              <Button onClick={() => router.push("/product-groups")}>
                Quay lại danh sách
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  const viewTotalPrice = calculateTotalPrice();

  return (
    <div style={{ padding: 24 }}>
      {contextHolder}
      {/* Header */}
      <Space style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push("/product-groups")}
        >
          Quay lại
        </Button>
        <Title level={2} style={{ margin: 0 }}>
          Chi tiết nhóm sản phẩm
        </Title>
      </Space>

      {/* Actions */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
            Chỉnh sửa
          </Button>
          <Button
            onClick={handleToggleStatus}
            loading={toggleStatusMutation.isPending}
          >
            {group.isActive ? "Ngừng kích hoạt" : "Kích hoạt"}
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleDelete}
            loading={deleteMutation.isPending}
          >
            Xóa
          </Button>
        </Space>
      </Card>

      {/* Basic Information */}
      <Card title="Thông tin cơ bản" style={{ marginBottom: 16 }}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="Tên nhóm" span={2}>
            {group.name}
          </Descriptions.Item>
          <Descriptions.Item label="Mô tả ngắn">
            {group.shortDescription || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Loại">
            {getTypeTag(group.type)}
          </Descriptions.Item>
          <Descriptions.Item label="Mô tả" span={2}>
            {group.description || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            {getStatusTag(group.isActive)}
          </Descriptions.Item>
          <Descriptions.Item label="Lượt xem">
            {group.views || 0}
          </Descriptions.Item>
          {group.tags && group.tags.length > 0 && (
            <Descriptions.Item label="Tags" span={2}>
              <Space wrap>
                {group.tags.map((tag, index) => (
                  <Tag key={index}>{tag}</Tag>
                ))}
              </Space>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Ngày tạo">
            {group.createdAt
              ? new Date(group.createdAt).toLocaleString("vi-VN")
              : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày cập nhật">
            {group.updatedAt
              ? new Date(group.updatedAt).toLocaleString("vi-VN")
              : "-"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Products */}
      <Card
        title={
          <Space>
            <ShoppingCartOutlined />
            <span>Danh sách sản phẩm ({group.products?.length || 0})</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        {!group.products || group.products.length === 0 ? (
          <Alert
            message="Chưa có sản phẩm nào"
            description="Thêm sản phẩm vào nhóm bằng cách chỉnh sửa nhóm sản phẩm."
            type="info"
            showIcon
          />
        ) : (
          <>
            <Table
              columns={viewProductColumns}
              dataSource={group.products}
              rowKey={(record, index) =>
                record.productId?._id || record.productId || index
              }
              pagination={false}
              scroll={{ x: 800 }}
            />
            <Divider />
            <Row justify="end">
              <Col>
                <Space>
                  <span style={{ fontSize: 16, fontWeight: 500 }}>
                    Tổng tiền:
                  </span>
                  <span
                    style={{
                      fontSize: 20,
                      fontWeight: 600,
                      color: "#f5222d",
                    }}
                  >
                    {formatPrice(viewTotalPrice)}
                  </span>
                </Space>
              </Col>
            </Row>
          </>
        )}
      </Card>
    </div>
  );
};

export default ProductGroupDetailPage;
