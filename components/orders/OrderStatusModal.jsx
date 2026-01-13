'use client';

import { useState, useEffect } from 'react';
import { Modal, Select, Input, message, Alert, Space, Tag } from 'antd';
import { OrderApi } from '@/apis/orders';
import {
  VALID_STATUS_TRANSITIONS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from '@/config/orderConstants';

const { Option } = Select;
const { TextArea } = Input;

const OrderStatusModal = ({ visible, order, onClose, onSuccess }) => {
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [validStatuses, setValidStatuses] = useState([]);

  // Use constants from orderConstants.js
  const statusTransitions = VALID_STATUS_TRANSITIONS;
  const statusLabels = ORDER_STATUS_LABELS;
  const statusColors = ORDER_STATUS_COLORS;

  useEffect(() => {
    if (visible && order) {
      const valid = statusTransitions[order.status] || [];
      setValidStatuses(valid);
      setNewStatus('');
      setNote('');
    }
  }, [visible, order, statusTransitions]);

  const handleSubmit = async () => {
    if (!newStatus) {
      message.warning('Vui lòng chọn trạng thái mới');
      return;
    }

    try {
      setLoading(true);
      await OrderApi.updateStatus(order._id, {
        status: newStatus,
        note: note.trim(),
      });

      message.success('Cập nhật trạng thái đơn hàng thành công');
      onSuccess();
      onClose();
    } catch (error) {
      message.error(error.response?.data?.message || 'Cập nhật trạng thái thất bại');
      console.error('Error updating order status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!order) {
    return null;
  }

  return (
    <Modal
      title="Cập nhật trạng thái đơn hàng"
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="Cập nhật"
      cancelText="Hủy"
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Current Status */}
        <div>
          <div style={{ marginBottom: 8 }}>
            <strong>Mã đơn hàng:</strong> {order.orderNumber}
          </div>
          <div>
            <strong>Trạng thái hiện tại:</strong>{' '}
            <Tag color={statusColors[order.status]}>
              {statusLabels[order.status]}
            </Tag>
          </div>
        </div>

        {/* Warning if no valid transitions */}
        {validStatuses.length === 0 && (
          <Alert
            message="Không thể cập nhật trạng thái"
            description={`Đơn hàng ở trạng thái "${statusLabels[order.status]}" không thể chuyển sang trạng thái khác.`}
            type="warning"
            showIcon
          />
        )}

        {/* Status Selection */}
        {validStatuses.length > 0 && (
          <>
            <div>
              <div style={{ marginBottom: 8 }}>
                <strong>Trạng thái mới:</strong>
              </div>
              <Select
                style={{ width: '100%' }}
                placeholder="Chọn trạng thái mới"
                value={newStatus}
                onChange={setNewStatus}
              >
                {validStatuses.map(status => (
                  <Option key={status} value={status}>
                    <Tag color={statusColors[status]}>
                      {statusLabels[status]}
                    </Tag>
                  </Option>
                ))}
              </Select>
            </div>

            {/* Note */}
            <div>
              <div style={{ marginBottom: 8 }}>
                <strong>Ghi chú (tùy chọn):</strong>
              </div>
              <TextArea
                rows={4}
                placeholder="Nhập ghi chú về việc cập nhật trạng thái..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                showCount
              />
            </div>

            {/* Info Alert */}
            <Alert
              message="Lưu ý"
              description={
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>Việc cập nhật trạng thái sẽ được ghi lại trong lịch sử đơn hàng</li>
                  <li>Khách hàng có thể nhận được thông báo về thay đổi trạng thái</li>
                  {newStatus === 'cancelled' && (
                    <li style={{ color: '#ff4d4f' }}>
                      <strong>Hủy đơn hàng sẽ hoàn trả số lượng sản phẩm về kho</strong>
                    </li>
                  )}
                </ul>
              }
              type="info"
              showIcon
            />
          </>
        )}
      </Space>
    </Modal>
  );
};

export default OrderStatusModal;

