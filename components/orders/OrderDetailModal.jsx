"use client";

import { useState } from "react";
import {
  Modal,
  Descriptions,
  Table,
  Tag,
  Timeline,
  Button,
  Space,
  Typography,
  Divider,
  Row,
  Col,
  Card,
  message,
  Image,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  CreditCardOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { OrderApi, PaymentApi } from "@/apis/orders";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
} from "@/config/orderConstants";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const OrderDetailModal = ({ visible, orderId, onClose, onUpdate }) => {
  // Query for order details
  const { data: orderData, isLoading: orderLoading } = useQuery({
    queryKey: ["orders", orderId, "detail"],
    queryFn: async () => {
      const response = await OrderApi.getById(orderId);
      return response.data;
    },
    enabled: visible && !!orderId,
  });

  // Query for payment details
  const { data: payment } = useQuery({
    queryKey: ["orders", orderId, "payment"],
    queryFn: async () => {
      const response = await PaymentApi.getByOrderId(orderId);
      return response.data;
    },
    enabled: visible && !!orderId,
    retry: false,
  });

  const order = orderData;
  const loading = orderLoading;

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getStatusColor = (status) => {
    return ORDER_STATUS_COLORS[status] || "default";
  };

  const getStatusLabel = (status) => {
    return ORDER_STATUS_LABELS[status] || status;
  };

  const productColumns = [
    {
      title: "Sản phẩm",
      key: "product",
      render: (_, record) => (
        <Space>
          {record.image && (
            <Image
              src={record.image}
              alt={record.name}
              width={50}
              height={50}
              style={{ objectFit: "cover" }}
            />
          )}
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            {record.productSku && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                SKU: {record.productSku}
              </Text>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      align: "center",
    },
    {
      title: "Đơn giá",
      dataIndex: "price",
      key: "price",
      width: 150,
      render: (price) => formatPrice(price),
    },
    {
      title: "Thành tiền",
      dataIndex: "subtotal",
      key: "subtotal",
      width: 150,
      render: (subtotal) => <strong>{formatPrice(subtotal)}</strong>,
    },
  ];

  if (!order) {
    return null;
  }

  return (
    <Modal
      title={
        <Space>
          <span>Chi tiết đơn hàng</span>
          <Tag color={getStatusColor(order.status)}>
            {getStatusLabel(order.status)}
          </Tag>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
        <Button
          key="update"
          type="primary"
          onClick={() => {
            onUpdate(order);
            onClose();
          }}
        >
          Cập nhật trạng thái
        </Button>,
      ]}
      loading={loading}
    >
      {/* Order Info */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Mã đơn hàng">
            <strong>{order.orderNumber}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">
            {dayjs(order.createdAt).format("DD/MM/YYYY HH:mm")}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Customer Info */}
      <Title level={5}>
        <UserOutlined /> Thông tin khách hàng
      </Title>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Họ tên">
            {order.shippingInfo?.name || order.customer?.userName || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            <MailOutlined /> {order.customer?.email || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">
            <PhoneOutlined />{" "}
            {order.shippingInfo?.phone || order.customer?.phone || "—"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Shipping Address */}
      <Title level={5}>
        <EnvironmentOutlined /> Địa chỉ giao hàng
      </Title>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Text>
          {order.shippingInfo?.address ||
            order.customer?.address ||
            order.shipping?.address?.street ||
            order.shipping?.address ||
            "—"}
        </Text>
        {order.shipping?.trackingNumber && (
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">Mã vận đơn: </Text>
            <Text strong>{order.shipping.trackingNumber}</Text>
          </div>
        )}
      </Card>

      {/* Products */}
      <Title level={5}>Sản phẩm đã đặt</Title>
      <Table
        columns={productColumns}
        dataSource={order.products || order.items || []}
        rowKey={(record) => record._id || record.id || record.productId}
        pagination={false}
        size="small"
        style={{ marginBottom: 16 }}
      />

      {/* Pricing Summary */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row justify="end">
          <Col span={8}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text>Tạm tính:</Text>
                <Text>{formatPrice(order.pricing?.subtotal)}</Text>
              </div>
              {(order.pricing?.discount > 0 || order.coupon?.discount > 0) && (
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Text>Giảm giá:</Text>
                  <Text type="danger">
                    -
                    {formatPrice(
                      order.pricing.discount || order.coupon?.discount || 0
                    )}
                  </Text>
                </div>
              )}
              {(order.pricing?.shippingCost > 0 ||
                order.pricing?.shipping > 0) && (
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Text>Phí vận chuyển:</Text>
                  <Text>
                    {formatPrice(
                      order.pricing.shippingCost || order.pricing.shipping
                    )}
                  </Text>
                </div>
              )}
              <Divider style={{ margin: "8px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text strong style={{ fontSize: 16 }}>
                  Tổng cộng:
                </Text>
                <Text strong style={{ fontSize: 16, color: "#1890ff" }}>
                  {formatPrice(order.pricing?.total)}
                </Text>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Payment Info */}
      <Title level={5}>
        <CreditCardOutlined /> Thông tin thanh toán
      </Title>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Phương thức">
            {order.payment?.method === "stripe"
              ? "Stripe"
              : order.payment?.method === "cod"
              ? "COD"
              : "Khác"}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag
              color={PAYMENT_STATUS_COLORS[order.payment?.status] || "default"}
            >
              {PAYMENT_STATUS_LABELS[order.payment?.status] ||
                order.payment?.status ||
                "—"}
            </Tag>
          </Descriptions.Item>
          {order.payment?.transactionId && (
            <Descriptions.Item label="Mã giao dịch" span={2}>
              <Text code>{order.payment.transactionId}</Text>
            </Descriptions.Item>
          )}
          {order.payment?.paidAt && (
            <Descriptions.Item label="Thời gian thanh toán">
              {dayjs(order.payment.paidAt).format("DD/MM/YYYY HH:mm")}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Status History */}
      <Title level={5}>
        <ClockCircleOutlined /> Lịch sử trạng thái
      </Title>
      <Timeline
        items={order.statusHistory?.map((history, index) => ({
          color: getStatusColor(history.status),
          children: (
            <div>
              <Text strong>{getStatusLabel(history.status)}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {dayjs(history.updatedAt).format("DD/MM/YYYY HH:mm")}
              </Text>
              {history.note && (
                <>
                  <br />
                  <Text style={{ fontSize: 12 }}>{history.note}</Text>
                </>
              )}
            </div>
          ),
        }))}
      />

      {/* Notes */}
      {(order.customerNote || order.notes?.customer) && (
        <>
          <Title level={5}>Ghi chú của khách hàng</Title>
          <Card size="small" style={{ marginBottom: 16 }}>
            <Text>{order.customerNote || order.notes?.customer}</Text>
          </Card>
        </>
      )}
    </Modal>
  );
};

export default OrderDetailModal;
