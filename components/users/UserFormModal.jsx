"use client";

import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Row,
  Col,
  message,
  Avatar,
  Button,
} from "antd";
import { UserOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";
import { UserApi } from "@/apis/auth";
import AddressInput from "@/components/common/AddressInput";
import ImageUpload from "@/components/common/ImageUpload";
import { USER_INFO, USER_ROLES, USER_ROLE_LABELS } from "@/config/constants";

const { Option } = Select;
const { TextArea } = Input;

const UserFormModal = ({
  visible,
  editingUser,
  onCancel,
  onSuccess,
  currentUser,
}) => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [avatarFile, setAvatarFile] = useState(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  // Check if current user is employee and trying to edit their own role
  const currentUserId = currentUser?._id || currentUser?.id;
  const editingUserId = editingUser?._id || editingUser?.id;
  const isSelfEdit = String(currentUserId) === String(editingUserId);

  useEffect(() => {
    if (visible) {
      if (editingUser) {
        // Edit mode - populate form with existing data
        form.setFieldsValue({
          userName: editingUser.userName,
          email: editingUser.email,
          role: editingUser.role,
          phone: editingUser.phone,
          gender: editingUser.gender,
          dateOfBirth: editingUser.dateOfBirth
            ? new Date(editingUser.dateOfBirth).toISOString().split("T")[0]
            : undefined,
          isActive: editingUser.isActive,
          address: editingUser.address || "",
        });
        setCurrentAvatarUrl(editingUser.avatar || "");
      } else {
        // Create mode - reset form
        form.resetFields();
        form.setFieldsValue({
          role: USER_ROLES.CUSTOMER,
          isActive: true,
        });
        setCurrentAvatarUrl("");
      }
    }
  }, [visible, editingUser, form]);

  const handleSubmit = async () => {
    try {
      setSubmitLoading(true);
      const values = await form.validateFields();

      // Check if current user is employee and trying to change their own role
      if (isSelfEdit) {
        const originalRole = editingUser?.role;
        if (values.role !== originalRole) {
          messageApi.error(
            "Bạn không có quyền chỉnh sửa vai trò của chính mình"
          );
          // Reset role field to original value
          form.setFieldsValue({ role: originalRole });
          setSubmitLoading(false);
          return;
        }
      }

      // Format data for API
      const userData = {
        userName: values.userName,
        email: values.email,
        role: values.role,
        phone: values.phone,
        gender: values.gender,
        dateOfBirth: values.dateOfBirth
          ? new Date(values.dateOfBirth)
          : undefined,
        isActive: values.isActive,
        address: values.address,
      };

      if (editingUser) {
        // Update existing user
        const updatedUser = await UserApi.updateUser(editingUser._id, userData);
        messageApi.success("Cập nhật người dùng thành công");

        // Check if updating current user, update localStorage if so
        if (typeof window !== "undefined") {
          const currentUserStr = localStorage.getItem(USER_INFO);
          if (currentUserStr) {
            try {
              const currentUser = JSON.parse(currentUserStr);
              if (currentUser._id === editingUser._id) {
                // Update localStorage with new user data
                const newUserData = {
                  ...currentUser,
                  ...userData,
                  avatar: updatedUser.avatar || currentUser.avatar,
                };
                localStorage.setItem(USER_INFO, JSON.stringify(newUserData));
                // Dispatch custom event to notify other components
                window.dispatchEvent(new Event("userInfoUpdated"));
              }
            } catch (error) {
              console.error(
                "Error parsing current user from localStorage:",
                error
              );
            }
          }
        }
      } else {
        // Create new user - need password
        if (!values.password) {
          messageApi.error("Vui lòng nhập mật khẩu");
          return;
        }
        userData.password = values.password;
        await UserApi.createUser(userData);
        messageApi.success("Tạo người dùng thành công");
      }

      // Upload avatar if new file selected
      if (avatarFile && (editingUser || !editingUser)) {
        // For new users, we need to get the user ID from the response
        const userId =
          editingUser?._id || (await UserApi.getProfile()).data._id;

        try {
          const formData = new FormData();
          formData.append("avatar", avatarFile);

          const avatarResponse = await UserApi.uploadAvatar(formData);
          messageApi.success("Upload avatar thành công");

          // If updating current user, also update avatar in localStorage
          if (editingUser && typeof window !== "undefined") {
            const currentUserStr = localStorage.getItem(USER_INFO);
            if (currentUserStr) {
              try {
                const currentUser = JSON.parse(currentUserStr);
                if (currentUser._id === editingUser._id) {
                  const newUserData = {
                    ...currentUser,
                    ...userData,
                    avatar:
                      avatarResponse?.data?.avatar ||
                      avatarResponse?.avatar ||
                      currentUser.avatar,
                  };
                  localStorage.setItem(USER_INFO, JSON.stringify(newUserData));
                  // Dispatch custom event to notify other components
                  window.dispatchEvent(new Event("userInfoUpdated"));
                }
              } catch (error) {
                console.error("Error updating avatar in localStorage:", error);
              }
            }
          }
        } catch (uploadError) {
          console.error("Upload avatar error:", uploadError);
          messageApi.warning(
            "Người dùng đã được lưu nhưng upload avatar thất bại"
          );
        }
      }

      form.resetFields();
      setCurrentAvatarUrl("");
      setAvatarFile(null);
      onSuccess();
    } catch (error) {
      messageApi.error(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAvatarSelect = (file) => {
    setAvatarFile(file);
  };

  const handleDeleteAvatar = async () => {
    // if (!editingUser?._id) return;
    // try {
    //   await UserApi.deleteAvatar();
    //   setCurrentAvatarUrl('');
    //   messageApi.success('Xóa avatar thành công');
    // } catch (error) {
    //   console.error('Delete avatar error:', error);
    //   messageApi.error('Xóa avatar thất bại');
    // }
  };

  return (
    <>
      {contextHolder}
      <Modal
        title={editingUser ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
        open={visible}
        onCancel={onCancel}
        onOk={handleSubmit}
        width={800}
        maskClosable={false}
        confirmLoading={submitLoading}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            role: USER_ROLES.CUSTOMER,
            isActive: true,
          }}
        >
          <Row gutter={16} className="space-y-4">
            <Col xs={24} sm={12}>
              <Form.Item
                name="userName"
                label="Tên đầy đủ"
                rules={[
                  { required: true, message: "Vui lòng nhập tên đầy đủ" },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Nhập tên đầy đủ"
                />
              </Form.Item>
            </Col>

            {/* Avatar Upload Section */}
            <Col xs={24} sm={12}>
              <div style={{ marginBottom: 24 }}>
                <label
                  style={{ display: "block", marginBottom: 8, fontWeight: 500 }}
                >
                  Avatar
                </label>

                {editingUser && currentAvatarUrl && (
                  <div
                    style={{
                      marginBottom: 12,
                      textAlign: "center",
                      display: "none",
                    }}
                  >
                    <div
                      style={{
                        marginBottom: 8,
                        fontSize: "12px",
                        color: "#666",
                      }}
                    >
                      Avatar hiện tại:
                    </div>
                    <div
                      style={{ position: "relative", display: "inline-block" }}
                    >
                      <Avatar
                        src={currentAvatarUrl}
                        size={60}
                        style={{ backgroundColor: "#f56a00" }}
                        icon={<UserOutlined />}
                      />
                      <Button
                        type="text"
                        danger
                        size="small"
                        onClick={handleDeleteAvatar}
                        style={{
                          position: "absolute",
                          top: -8,
                          right: -8,
                          borderRadius: "50%",
                          width: 20,
                          height: 20,
                          padding: 0,
                          backgroundColor: "rgba(255, 77, 79, 0.8)",
                          color: "white",
                          fontSize: "12px",
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                )}

                <ImageUpload
                  onImageSelect={handleAvatarSelect}
                  currentImage={currentAvatarUrl || editingUser?.avatar || null}
                  multiple={false}
                  maxSize={5}
                  placeholder="Chọn avatar"
                  showPreview={true}
                  isAvatar={true}
                />
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Vui lòng nhập email" },
                  { type: "email", message: "Email không hợp lệ" },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="Nhập email"
                  disabled={!!editingUser} // Cannot change email in edit mode
                />
              </Form.Item>
            </Col>
          </Row>

          {!editingUser && (
            <Row gutter={16} className="!space-y-4">
              <Col xs={24} sm={12}>
                <Form.Item
                  name="password"
                  label="Mật khẩu"
                  rules={[
                    { required: true, message: "Vui lòng nhập mật khẩu" },
                    { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
                  ]}
                >
                  <Input.Password placeholder="Nhập mật khẩu" />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Row gutter={16} className="!space-y-4 mt-4">
            <Col xs={24} sm={8}>
              <Form.Item
                name="role"
                label="Vai trò"
                rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
                help={
                  isSelfEdit
                    ? "Bạn không có quyền chỉnh sửa vai trò của chính mình"
                    : null
                }
              >
                <Select placeholder="Chọn vai trò" disabled={isSelfEdit}>
                  <Option value={USER_ROLES.CUSTOMER}>
                    {USER_ROLE_LABELS[USER_ROLES.CUSTOMER]}
                  </Option>
                  <Option value={USER_ROLES.EMPLOYEE}>
                    {USER_ROLE_LABELS[USER_ROLES.EMPLOYEE]}
                  </Option>
                  <Option value={USER_ROLES.ADMIN}>
                    {USER_ROLE_LABELS[USER_ROLES.ADMIN]}
                  </Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại" },
                  {
                    pattern: /^[+]?[\d\s-()]+$/,
                    message: "Số điện thoại không hợp lệ",
                  },
                  {
                    min: 10,
                    message: "Số điện thoại phải có ít nhất 10 ký tự",
                  },
                ]}
              >
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder="Nhập số điện thoại"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="gender" label="Giới tính">
                <Select placeholder="Chọn giới tính">
                  <Option value="male">Nam</Option>
                  <Option value="female">Nữ</Option>
                  <Option value="other">Khác</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16} className="space-y-4">
            <Col xs={24} sm={12}>
              <Form.Item name="dateOfBirth" label="Ngày sinh">
                <Input type="date" placeholder="Chọn ngày sinh" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="isActive"
                label="Trạng thái tài khoản"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="Hoạt động"
                  unCheckedChildren="Vô hiệu"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16} className="space-y-4">
            <Col xs={24}>
              <Form.Item
                name="address"
                label="Địa chỉ"
                help="Nhập địa chỉ hoặc nhấn vào biểu tượng bản đồ để chọn từ map"
              >
                <AddressInput placeholder="Nhập địa chỉ đầy đủ..." />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
};

export default UserFormModal;
