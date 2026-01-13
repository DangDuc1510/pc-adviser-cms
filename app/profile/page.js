'use client'

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Row, 
  Col, 
  Avatar, 
  message, 
  Divider,
  Select,
  Modal
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EditOutlined,
  KeyOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { CameraOutlined } from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UserApi, AuthApi } from '@/apis/auth';
import { USER_INFO, USER_ROLE_LABELS } from '@/config/constants';
import AddressInput from '@/components/common/AddressInput';
import ImageUpload from '@/components/common/ImageUpload';

const { Option } = Select;

const ProfilePage = () => {
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Query for user profile
  const { data: user, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await UserApi.getProfile();
      // Update localStorage
      localStorage.setItem(USER_INFO, JSON.stringify(response));
      return response;
    },
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        userName: user.userName,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : undefined,
        address: user.address || ''
      });
    }
  }, [user, form]);

  // Handle profile update
  const handleUpdateProfile = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const updateData = {
        userName: values.userName,
        phone: values.phone,
        gender: values.gender,
        dateOfBirth: values.dateOfBirth ? new Date(values.dateOfBirth) : undefined,
        address: values.address
      };

      const response = await UserApi.updateProfile(updateData);
      
      // Invalidate and refetch profile
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Update localStorage with new user data
      if (typeof window !== 'undefined') {
        const currentUserStr = localStorage.getItem(USER_INFO);
        if (currentUserStr) {
          try {
            const currentUser = JSON.parse(currentUserStr);
            const newUserData = {
              ...currentUser,
              ...updateData,
              avatar: response.avatar || currentUser.avatar
            };
            localStorage.setItem(USER_INFO, JSON.stringify(newUserData));
            // Dispatch custom event to notify other components
            window.dispatchEvent(new Event('userInfoUpdated'));
          } catch (error) {
            console.error('Error updating localStorage:', error);
            // Fallback to direct update if parsing fails
            localStorage.setItem(USER_INFO, JSON.stringify(response));
            window.dispatchEvent(new Event('userInfoUpdated'));
          }
        } else {
          // If no current user in localStorage, set the response directly
          localStorage.setItem(USER_INFO, JSON.stringify(response));
          window.dispatchEvent(new Event('userInfoUpdated'));
        }
      }
      
      messageApi.success('Cập nhật thông tin thành công');
      setEditing(false);
    } catch (error) {
      messageApi.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  // Handle change password
  const handleChangePassword = async () => {
    try {
      const values = await passwordForm.validateFields();
      setPasswordLoading(true);

      await AuthApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });

      messageApi.success('Đổi mật khẩu thành công. Bạn sẽ được chuyển về trang đăng nhập.');
      setPasswordModalVisible(false);
      passwordForm.resetFields();
      
      // Clear token and redirect to login
      setTimeout(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
        window.location.href = '/login';
      }, 2000);
    } catch (error) {
      messageApi.error(error.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle avatar upload
  const handleUploadAvatar = async () => {
    if (!avatarFile) {
      messageApi.error('Vui lòng chọn ảnh avatar');
      return;
    }
    try {
      setAvatarUploading(true);
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const response = await UserApi.uploadAvatar(formData);
      const updatedUser = response?.data?.user || response?.user || null;

      if (updatedUser) {
        localStorage.setItem(USER_INFO, JSON.stringify(updatedUser));
        // Invalidate and refetch profile
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        // Dispatch custom event to notify other components
        window.dispatchEvent(new Event('userInfoUpdated'));
      }

      messageApi.success(response?.message || 'Cập nhật avatar thành công');
      setAvatarModalVisible(false);
      setAvatarFile(null);
    } catch (error) {
      messageApi.error(error.response?.data?.message || 'Có lỗi xảy ra khi tải ảnh');
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div className="p-6">
      {contextHolder}
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card className="mb-6">
          <div className="flex items-center gap-6 ">
            <Avatar
              size={100}
              icon={<UserOutlined />}
              className="!bg-gradient-to-r !from-blue-500 !to-teal-500 !w-20 !h-20"
              src={user?.avatar}
            />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800">
                {user?.userName || 'Chưa có tên'}
              </h1>
              <p className="text-gray-600">{user?.email}</p>
              <p className="text-sm text-blue-600 font-medium">
                {USER_ROLE_LABELS[user?.role] || user?.role}
              </p>
            </div>
            <div className="space-x-2">
              {!editing ? (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => setEditing(true)}
                >
                  Chỉnh sửa
                </Button>
              ) : (
                <>
                  <Button onClick={() => setEditing(false)}>
                    Hủy
                  </Button>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={loading}
                    onClick={handleUpdateProfile}
                  >
                    Lưu
                  </Button>
                </>
              )}
              <Button
                icon={<KeyOutlined />}
                onClick={() => setPasswordModalVisible(true)}
              >
                Đổi mật khẩu
              </Button>
              <Button
                icon={<CameraOutlined />}
                onClick={() => setAvatarModalVisible(true)}
              >
                Đổi avatar
              </Button>
            </div>
          </div>
        </Card>

        {/* Profile Information */}
        <Card title="Thông tin cá nhân" loading={profileLoading}>
          <Form
            form={form}
            layout="vertical"
            disabled={!editing}
          >
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="userName"
                  label="Tên đầy đủ"
                  rules={[
                    { required: true, message: 'Vui lòng nhập tên đầy đủ' }
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="Nhập tên đầy đủ"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="email"
                  label="Email"
                >
                  <Input
                    prefix={<MailOutlined />}
                    disabled // Email cannot be changed
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="phone"
                  label="Số điện thoại"
                >
                  <Input
                    prefix={<PhoneOutlined />}
                    placeholder="Nhập số điện thoại"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="gender"
                  label="Giới tính"
                >
                  <Select placeholder="Chọn giới tính">
                    <Option value="male">Nam</Option>
                    <Option value="female">Nữ</Option>
                    <Option value="other">Khác</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="dateOfBirth"
                  label="Ngày sinh"
                >
                  <Input
                    type="date"
                    placeholder="Chọn ngày sinh"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider>Địa chỉ</Divider>

            <Row gutter={16}>
              <Col xs={24}>
                <Form.Item
                  name="address"
                  label="Địa chỉ"
                  help="Nhập địa chỉ hoặc nhấn vào biểu tượng bản đồ để chọn từ map"
                >
                  <AddressInput 
                    placeholder="Nhập địa chỉ đầy đủ..."
                    disabled={!editing}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* Change Password Modal */}
        <Modal
          title="Đổi mật khẩu"
          open={passwordModalVisible}
          onCancel={() => {
            setPasswordModalVisible(false);
            passwordForm.resetFields();
          }}
          onOk={handleChangePassword}
          confirmLoading={passwordLoading}
        >
          <Form
            form={passwordForm}
            layout="vertical"
          >
            <Form.Item
              name="currentPassword"
              label="Mật khẩu hiện tại"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }
              ]}
            >
              <Input.Password
                prefix={<KeyOutlined />}
                placeholder="Nhập mật khẩu hiện tại"
              />
            </Form.Item>

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

        {/* Change Avatar Modal */}
        <Modal
          title="Đổi avatar"
          open={avatarModalVisible}
          onCancel={() => {
            setAvatarModalVisible(false);
            setAvatarFile(null);
          }}
          onOk={handleUploadAvatar}
          confirmLoading={avatarUploading}
        >
          <ImageUpload
            onImageSelect={setAvatarFile}
            currentImage={user?.avatar}
            multiple={false}
            accept="image/*"
            maxSize={5}
          />
        </Modal>
      </div>
    </div>
  );
};

export default ProfilePage;
