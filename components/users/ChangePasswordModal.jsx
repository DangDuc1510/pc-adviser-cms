'use client'

import React from 'react';
import {
  Modal,
  Form,
  Input,
  message
} from 'antd';
import { KeyOutlined } from '@ant-design/icons';
import { UserApi } from '@/apis/auth';

const ChangePasswordModal = ({ visible, userId, userName, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      await UserApi.changeUserPassword(userId, {
        newPassword: values.newPassword
      });

      form.resetFields();
      onSuccess();
    } catch (error) {
      messageApi.error(error.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu');
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <>
      {contextHolder}
      <Modal
        title={`Đổi mật khẩu cho: ${userName}`}
        open={visible}
        onCancel={handleCancel}
        onOk={handleSubmit}
        width={400}
        maskClosable={false}
      >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="newPassword"
          label="Mật khẩu mới"
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu mới' },
            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
          ]}
        >
          <Input.Password
            prefix={<KeyOutlined />}
            placeholder="Nhập mật khẩu mới"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Xác nhận mật khẩu"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Vui lòng xác nhận mật khẩu' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<KeyOutlined />}
            placeholder="Xác nhận mật khẩu mới"
          />
        </Form.Item>
      </Form>
      </Modal>
    </>
  );
};

export default ChangePasswordModal;
