"use client";

import React, { useState } from "react";
import {
  Card,
  Descriptions,
  Tabs,
  Table,
  Tag,
  Space,
  Button,
  message,
  Spin,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  BarChartOutlined,
  TeamOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { CustomerApi } from "@/apis/customer";
import { BehaviorApi } from "@/apis/behavior";
import { SegmentationApi } from "@/apis/segmentation";
import { formatPrice } from "@/utils/format";
import { extractUserId } from "@/utils/customer";

const { TabPane } = Tabs;

const CustomerDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id;
  const [activeTab, setActiveTab] = useState("info");

  // Query customer
  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: async () => {
      const response = await CustomerApi.getById(customerId);
      return response;
    },
    enabled: !!customerId,
  });

  // Query behavior summary
  const { data: behaviorSummary, isLoading: behaviorLoading } = useQuery({
    queryKey: ["customerBehaviorSummary", customerId],
    queryFn: async () => {
      const response = await BehaviorApi.getSummary(customerId);
      return response;
    },
    enabled: !!customerId && activeTab === "behavior",
  });

  // Query behavior timeline
  const { data: behaviorTimeline, isLoading: timelineLoading } = useQuery({
    queryKey: ["customerBehaviorTimeline", customerId],
    queryFn: async () => {
      const response = await BehaviorApi.getTimeline(customerId, {
        limit: 100,
      });
      return response;
    },
    enabled: !!customerId && activeTab === "behavior",
  });

  // Query orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["customerOrders", customerId],
    queryFn: async () => {
      const response = await CustomerApi.getOrders(customerId);
      return response;
    },
    enabled: !!customerId && activeTab === "orders",
  });

  // Extract userId from customer
  const userId = customer ? extractUserId(customer) : null;

  // Query segmentation
  const queryClient = useQueryClient();
  const {
    data: segmentationData,
    isLoading: segmentationLoading,
    refetch: refetchSegmentation,
  } = useQuery({
    queryKey: ["customerSegmentation", userId || customerId],
    queryFn: async () => {
      // Use userId if available, otherwise fallback to customerId
      const identifier = userId || customerId;
      if (!identifier) {
        throw new Error("Không tìm thấy userId hoặc customerId");
      }
      const response = await SegmentationApi.analyzeCustomer(identifier);
      return response.data || response;
    },
    enabled: !!(userId || customerId) && activeTab === "segmentation",
  });

  // Mutation to analyze customer
  const analyzeCustomerMutation = useMutation({
    mutationFn: async () => {
      // Use userId if available, otherwise fallback to customerId
      const identifier = userId || customerId;
      if (!identifier) {
        throw new Error("Không tìm thấy userId hoặc customerId");
      }
      return await SegmentationApi.forceAnalyzeCustomer(identifier);
    },
    onSuccess: () => {
      message.success("Phân tích thành công");
      refetchSegmentation();
      queryClient.invalidateQueries(["customer", customerId]);
    },
    onError: (error) => {
      message.error(
        "Phân tích thất bại: " + (error.message || "Lỗi không xác định")
      );
    },
  });

  if (customerLoading) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div style={{ padding: "24px" }}>
        <Card>
          <p>Không tìm thấy khách hàng</p>
          <Button onClick={() => router.push("/customers")}>Quay lại</Button>
        </Card>
      </div>
    );
  }

  // Behavior timeline columns
  const behaviorColumns = [
    {
      title: "Thời gian",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 180,
      render: (date) => (date ? new Date(date).toLocaleString("vi-VN") : "-"),
    },
    {
      title: "Loại",
      dataIndex: "eventType",
      key: "eventType",
      width: 150,
      render: (type) => {
        const colors = {
          view: "blue",
          click: "cyan",
          search: "green",
          add_to_cart: "orange",
          purchase: "red",
          navigation: "purple",
        };
        return <Tag color={colors[type] || "default"}>{type}</Tag>;
      },
    },
    {
      title: "Entity",
      dataIndex: "entityType",
      key: "entityType",
      width: 120,
    },
    {
      title: "ID",
      dataIndex: "entityId",
      key: "entityId",
      width: 150,
      render: (id) => (id ? id.substring(0, 20) + "..." : "-"),
    },
    {
      title: "Metadata",
      dataIndex: "metadata",
      key: "metadata",
      render: (meta) => {
        if (!meta) return "-";
        const keys = Object.keys(meta).slice(0, 2);
        return keys.map((key) => `${key}: ${meta[key]}`).join(", ");
      },
    },
  ];

  // Orders columns
  const ordersColumns = [
    {
      title: "Mã đơn",
      dataIndex: "orderNumber",
      key: "orderNumber",
    },
    {
      title: "Ngày đặt",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => (date ? new Date(date).toLocaleString("vi-VN") : "-"),
    },
    {
      title: "Tổng tiền",
      dataIndex: ["pricing", "total"],
      key: "total",
      render: (amount) => formatPrice(amount || 0),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const colors = {
          pending: "orange",
          confirmed: "blue",
          processing: "cyan",
          shipped: "purple",
          delivered: "green",
          cancelled: "red",
        };
        return <Tag color={colors[status] || "default"}>{status}</Tag>;
      },
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Card>
        <Space style={{ marginBottom: 24 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/customers")}
          >
            Quay lại
          </Button>
        </Space>

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <span>
                <UserOutlined />
                Thông tin
              </span>
            }
            key="info"
          >
            <Descriptions bordered column={2}>
              <Descriptions.Item label="ID">{customer._id}</Descriptions.Item>
              <Descriptions.Item label="Loại">
                <Tag
                  color={
                    customer.customerType === "registered" ? "blue" : "orange"
                  }
                >
                  {customer.customerType === "registered"
                    ? "Đã đăng ký"
                    : "Khách"}
                </Tag>
              </Descriptions.Item>
              {customer.userId && (
                <>
                  <Descriptions.Item label="Tên người dùng">
                    {customer.userId?.userName || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">
                    {customer.userId?.email || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số điện thoại">
                    {customer.userId?.phone || "-"}
                  </Descriptions.Item>
                </>
              )}
              <Descriptions.Item label="Lần đầu">
                {customer.firstSeenAt
                  ? new Date(customer.firstSeenAt).toLocaleString("vi-VN")
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Lần cuối">
                {customer.lastSeenAt
                  ? new Date(customer.lastSeenAt).toLocaleString("vi-VN")
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng đơn hàng">
                {customer.totalOrders || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng chi tiêu">
                {formatPrice(customer.totalSpent || 0)}
              </Descriptions.Item>
              {customer.segmentation && (
                <>
                  <Descriptions.Item label="Phân loại">
                    <Tag
                      color={
                        customer.segmentation.type === "potential"
                          ? "cyan"
                          : customer.segmentation.type === "loyal"
                          ? "green"
                          : customer.segmentation.type === "at_risk"
                          ? "orange"
                          : customer.segmentation.type === "churned"
                          ? "red"
                          : "default"
                      }
                    >
                      {customer.segmentation.type === "potential"
                        ? "Tiềm năng"
                        : customer.segmentation.type === "loyal"
                        ? "Trung thành"
                        : customer.segmentation.type === "at_risk"
                        ? "Chuẩn bị rời bỏ"
                        : customer.segmentation.type === "churned"
                        ? "Rời bỏ"
                        : customer.segmentation.type}
                    </Tag>
                  </Descriptions.Item>
                  {customer.segmentation.score !== undefined && (
                    <Descriptions.Item label="Điểm số">
                      {customer.segmentation.score}
                    </Descriptions.Item>
                  )}
                </>
              )}
            </Descriptions>
          </TabPane>

          <TabPane
            tab={
              <span>
                <BarChartOutlined />
                Hành vi
              </span>
            }
            key="behavior"
          >
            {behaviorLoading ? (
              <Spin />
            ) : (
              <>
                {behaviorSummary && (
                  <Card title="Tóm tắt" style={{ marginBottom: 16 }}>
                    <Space direction="vertical" style={{ width: "100%" }}>
                      {behaviorSummary.eventTypeSummary?.map((item) => (
                        <div key={item._id}>
                          <strong>{item._id}:</strong> {item.count} lần
                        </div>
                      ))}
                    </Space>
                  </Card>
                )}
                <Card title="Timeline">
                  <Table
                    columns={behaviorColumns}
                    dataSource={behaviorTimeline || []}
                    rowKey="_id"
                    loading={timelineLoading}
                    pagination={{ pageSize: 20 }}
                  />
                </Card>
              </>
            )}
          </TabPane>

          <TabPane
            tab={
              <span>
                <ShoppingCartOutlined />
                Đơn hàng
              </span>
            }
            key="orders"
          >
            <Table
              columns={ordersColumns}
              dataSource={ordersData?.data?.orders || ordersData?.orders || []}
              rowKey="_id"
              loading={ordersLoading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <TeamOutlined />
                Phân loại
              </span>
            }
            key="segmentation"
          >
            {segmentationLoading ? (
              <Spin />
            ) : (
              <Card
                title="Thông tin Phân loại"
                extra={
                  <Button
                    icon={<SyncOutlined />}
                    onClick={() => analyzeCustomerMutation.mutate()}
                    loading={analyzeCustomerMutation.isPending}
                  >
                    Phân tích lại
                  </Button>
                }
              >
                {segmentationData ? (
                  <Descriptions bordered column={2}>
                    <Descriptions.Item label="Loại">
                      <Tag
                        color={
                          segmentationData.type === "potential"
                            ? "cyan"
                            : segmentationData.type === "loyal"
                            ? "green"
                            : segmentationData.type === "at_risk"
                            ? "orange"
                            : segmentationData.type === "churned"
                            ? "red"
                            : "default"
                        }
                      >
                        {segmentationData.type === "potential"
                          ? "Tiềm năng"
                          : segmentationData.type === "loyal"
                          ? "Trung thành"
                          : segmentationData.type === "at_risk"
                          ? "Chuẩn bị rời bỏ"
                          : segmentationData.type === "churned"
                          ? "Rời bỏ"
                          : segmentationData.type}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Điểm số">
                      {segmentationData.score !== undefined
                        ? `${segmentationData.score}`
                        : "-"}
                    </Descriptions.Item>
                    {segmentationData.reasons &&
                      segmentationData.reasons.length > 0 && (
                        <Descriptions.Item label="Lý do" span={2}>
                          <ul style={{ margin: 0, paddingLeft: 20 }}>
                            {segmentationData.reasons.map((reason, index) => (
                              <li key={index}>{reason}</li>
                            ))}
                          </ul>
                        </Descriptions.Item>
                      )}
                    {segmentationData.rfm && (
                      <>
                        <Descriptions.Item label="RFM - Recency">
                          {segmentationData.rfm.recency !== null
                            ? `${segmentationData.rfm.recency} ngày`
                            : "N/A"}
                        </Descriptions.Item>
                        <Descriptions.Item label="RFM - Frequency">
                          {segmentationData.rfm.frequency} đơn hàng
                        </Descriptions.Item>
                        <Descriptions.Item label="RFM - Monetary">
                          {formatPrice(segmentationData.rfm.monetary || 0)}
                        </Descriptions.Item>
                      </>
                    )}
                    {segmentationData.behavior && (
                      <>
                        <Descriptions.Item label="Sự kiện gần đây">
                          {segmentationData.behavior.recentEventCount || 0}
                        </Descriptions.Item>
                        <Descriptions.Item label="Điểm tương tác">
                          {segmentationData.behavior.engagementScore || 0}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày từ lần hoạt động cuối">
                          {segmentationData.behavior.daysSinceLastActivity !==
                          undefined
                            ? `${segmentationData.behavior.daysSinceLastActivity} ngày`
                            : "-"}
                        </Descriptions.Item>
                      </>
                    )}
                    {segmentationData.lastAnalyzed && (
                      <Descriptions.Item label="Lần phân tích cuối">
                        {new Date(segmentationData.lastAnalyzed).toLocaleString(
                          "vi-VN"
                        )}
                      </Descriptions.Item>
                    )}
                    {segmentationData.metadata && (
                      <Descriptions.Item label="Tổng đơn hàng">
                        {segmentationData.metadata.totalOrders || 0}
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                ) : (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <p>Chưa có thông tin phân loại</p>
                    <Button
                      type="primary"
                      icon={<SyncOutlined />}
                      onClick={() => analyzeCustomerMutation.mutate()}
                      loading={analyzeCustomerMutation.isPending}
                    >
                      Phân tích ngay
                    </Button>
                  </div>
                )}
              </Card>
            )}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default CustomerDetailPage;
