"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Select,
  Tag,
  Popconfirm,
  message,
  Modal,
  Form,
  Row,
  Col,
  Switch,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  KeyOutlined,
  UserOutlined,
  UserAddOutlined,
  ReloadOutlined,
  FilterOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserApi } from "@/apis/auth";
import UserFormModal from "@/components/users/UserFormModal";
import ChangePasswordModal from "@/components/users/ChangePasswordModal";
import PermissionManager from "@/components/users/PermissionManager";
import PermissionWrapper from "@/components/common/PermissionWrapper";
import {
  getCurrentUser,
  hasPermission,
  PERMISSIONS,
} from "@/utils/permissions";
import { USER_ROLES, USER_ROLE_LABELS } from "@/config/constants";
import { debounce } from "@/utils";

const { Option } = Select;

const UsersPage = () => {
  const queryClient = useQueryClient();
  const currentUser = getCurrentUser();
  const [messageApi, contextHolder] = message.useMessage();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    role: null,
    isActive: undefined,
  });

  const canCreateUsers = hasPermission(currentUser, PERMISSIONS.CREATE_USERS);
  const canEditUsers = hasPermission(currentUser, PERMISSIONS.EDIT_USERS);
  const canDeleteUsers = hasPermission(currentUser, PERMISSIONS.DELETE_USERS);
  const canManageUserRoles = hasPermission(
    currentUser,
    PERMISSIONS.MANAGE_USER_ROLES
  );

  // Modals state
  const [userFormModal, setUserFormModal] = useState({
    visible: false,
    editingUser: null,
  });
  const [changePasswordModal, setChangePasswordModal] = useState({
    visible: false,
    userId: null,
    userName: "",
  });
  const [permissionModal, setPermissionModal] = useState({
    visible: false,
    user: null,
  });

  // Query for users
  const { data: usersData, isLoading: loading } = useQuery({
    queryKey: ["users", pagination.current, pagination.pageSize, filters],
    queryFn: async () => {
      const queryParams = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters,
      };

      const response = await UserApi.getAllUsers(queryParams);
      return {
        users: response.users,
        pagination: response.pagination,
      };
    },
  });

  const users = usersData?.users || [];
  const paginationData = usersData?.pagination || { current: 1, total: 0 };

  // Handle table change (pagination, sort, filter)
  const handleTableChange = (newPagination) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
      total: newPagination.total,
    });
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  // Stable debounced search updater
  const debouncedSearchChange = useMemo(
    () =>
      debounce((value) => {
        handleFilterChange("search", value);
      }, 500),
    []
  );

  const handleSearchInputChange = (e) => {
    debouncedSearchChange(e.target.value);
  };

  // Handle search
  const handleSearch = debounce(() => {
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, 500);

  // Clear filters
  const clearFilters = () => {
    setFilters({
      search: "",
      role: null,
      isActive: undefined,
    });
  };

  // Handle toggle user status
  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await UserApi.toggleUserStatus(userId, { isActive: !currentStatus });
      messageApi.success(
        `Đã ${
          !currentStatus ? "kích hoạt" : "vô hiệu hóa"
        } tài khoản thành công`
      );
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (error) {
      messageApi.error(error.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId) => {
    try {
      // Check if current user is trying to delete themselves
      const currentUserId = currentUser?._id || currentUser?.id;
      const targetUserId = userId;

      if (currentUser && String(currentUserId) === String(targetUserId)) {
        messageApi.error("Bạn không thể xóa tài khoản của chính mình");
        return;
      }

      await UserApi.deleteUser(userId);
      messageApi.success("Xóa người dùng thành công");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (error) {
      messageApi.error(
        error.response?.data?.message || "Có lỗi xảy ra khi xóa người dùng"
      );
    }
  };

  // Handle role change
  const handleRoleChange = async (userId, newRole) => {
    try {
      // Check if current user is employee and trying to change their own role
      const currentUserId = currentUser?._id || currentUser?.id;
      const targetUserId = userId;

      if (
        currentUser &&
        currentUser.role === USER_ROLES.EMPLOYEE &&
        String(currentUserId) === String(targetUserId)
      ) {
        messageApi.error("Bạn không có quyền chỉnh sửa vai trò của chính mình");
        // Reset select to original value
        queryClient.invalidateQueries({ queryKey: ["users"] });
        return;
      }

      await UserApi.updateUserRole(userId, { role: newRole });
      messageApi.success("Cập nhật vai trò thành công");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (error) {
      messageApi.error(
        error.response?.data?.message || "Có lỗi xảy ra khi cập nhật vai trò"
      );
      // Reset on error
      queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  };

  // Table columns
  const columns = [
    {
      title: "Tên",
      dataIndex: "userName",
      key: "userName",
      render: (text, record) => (
        <Space>
          <UserOutlined />
          <span>{text || "Chưa có tên"}</span>
        </Space>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role, record) => {
        // Check if current user is employee and trying to change their own role
        const currentUserId = currentUser?._id || currentUser?.id;
        const recordUserId = record._id || record.id;
        const isSelfEdit = currentUserId.toString() === recordUserId.toString();

        // If employee editing themselves, show readonly tag instead of select
        if (isSelfEdit) {
          return (
            <Tag
              color="blue"
              title="Bạn không có quyền chỉnh sửa vai trò của chính mình"
            >
              {USER_ROLE_LABELS[role] || role}
            </Tag>
          );
        }

        return (
          <Select
            value={role}
            style={{ width: 140 }}
            onChange={(newRole) => handleRoleChange(recordUserId, newRole)}
            size="small"
            disabled={isSelfEdit}
          >
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
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive, record) => (
        <Switch
          checked={isActive}
          onChange={() => handleToggleStatus(record._id, isActive)}
          checkedChildren="Hoạt động"
          unCheckedChildren="Vô hiệu"
          size="large"
        />
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => {
        // Check if current user is trying to delete themselves
        const currentUserId = currentUser?._id || currentUser?.id;
        const recordUserId = record._id || record.id;
        const isSelfDelete =
          currentUserId && String(currentUserId) === String(recordUserId);

        return (
          <Space>
            {canEditUsers && (
              <Tooltip title="Chỉnh sửa">
                <Button
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() =>
                    setUserFormModal({
                      visible: true,
                      editingUser: record,
                    })
                  }
                />
              </Tooltip>
            )}
            {canManageUserRoles && (
              <Tooltip title="Quản lý quyền">
                <Button
                  icon={<SafetyOutlined />}
                  size="small"
                  onClick={() =>
                    setPermissionModal({
                      visible: true,
                      user: record,
                    })
                  }
                />
              </Tooltip>
            )}
            {canEditUsers && (
              <Tooltip title="Đổi mật khẩu">
                <Button
                  icon={<KeyOutlined />}
                  size="small"
                  onClick={() =>
                    setChangePasswordModal({
                      visible: true,
                      userId: record._id,
                      userName: record.userName || record.email,
                    })
                  }
                />
              </Tooltip>
            )}
            {canDeleteUsers && !isSelfDelete && (
              <Tooltip title="Xóa">
                <Popconfirm
                  title="Bạn có chắc chắn muốn xóa người dùng này?"
                  onConfirm={() => handleDeleteUser(record._id)}
                  okText="Xóa"
                  cancelText="Hủy"
                >
                  <Button icon={<DeleteOutlined />} size="small" danger />
                </Popconfirm>
              </Tooltip>
            )}
            {canDeleteUsers && isSelfDelete && (
              <Tooltip title="Bạn không thể xóa tài khoản của chính mình">
                <Button
                  icon={<DeleteOutlined />}
                  size="small"
                  danger
                  disabled
                />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="p-6">
      {contextHolder}
      <Card>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Quản lý Người dùng
          </h1>

          {/* Filter controls */}
          <Row gutter={[16, 16]} className="mb-4">
            <Col xs={24} sm={12} md={8}>
              <Input
                placeholder="Tìm kiếm theo tên hoặc email..."
                // value={filters.search}
                onChange={handleSearchInputChange}
                onPressEnter={handleSearch}
                prefix={<SearchOutlined />}
              />
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Select
                placeholder="Vai trò"
                value={filters.role}
                onChange={(value) => handleFilterChange("role", value)}
                allowClear
                style={{ width: "100%" }}
              >
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
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Select
                placeholder="Trạng thái"
                value={filters.isActive}
                onChange={(value) => handleFilterChange("isActive", value)}
                allowClear
                style={{ width: "100%" }}
              >
                <Option value="true">Hoạt động</Option>
                <Option value="false">Vô hiệu</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Space>
                <Tooltip title="Xóa bộ lọc">
                  <Button
                    icon={<DeleteOutlined />}
                    onClick={clearFilters}
                  ></Button>
                </Tooltip>
                <Tooltip title="Tải lại">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() =>
                      queryClient.invalidateQueries({ queryKey: ["users"] })
                    }
                  ></Button>
                </Tooltip>
              </Space>
            </Col>
            <Col xs={24} sm={12} md={4} className="!flex !justify-end">
              {canCreateUsers && (
                <Tooltip title="Thêm người dùng">
                  <Button
                    type="primary"
                    icon={<UserAddOutlined />}
                    onClick={() =>
                      setUserFormModal({
                        visible: true,
                        editingUser: null,
                      })
                    }
                  >
                    Thêm người dùng
                  </Button>
                </Tooltip>
              )}
            </Col>
          </Row>
        </div>

        {/* Users table */}
        <Table
          columns={columns}
          dataSource={users}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: paginationData.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} người dùng`,
          }}
          onChange={handleTableChange}
        />

        {/* User Form Modal */}
        <UserFormModal
          visible={userFormModal.visible}
          editingUser={userFormModal.editingUser}
          currentUser={currentUser}
          onCancel={() =>
            setUserFormModal({
              visible: false,
              editingUser: null,
            })
          }
          onSuccess={() => {
            setUserFormModal({
              visible: false,
              editingUser: null,
            });
            queryClient.invalidateQueries({ queryKey: ["users"] });
          }}
        />

        {/* Change Password Modal */}
        <ChangePasswordModal
          visible={changePasswordModal.visible}
          userId={changePasswordModal.userId}
          userName={changePasswordModal.userName}
          onCancel={() =>
            setChangePasswordModal({
              visible: false,
              userId: null,
              userName: "",
            })
          }
          onSuccess={() => {
            setChangePasswordModal({
              visible: false,
              userId: null,
              userName: "",
            });
            messageApi.success("Đổi mật khẩu thành công");
          }}
        />

        {/* Permission Manager Modal */}
        <PermissionManager
          visible={permissionModal.visible}
          user={permissionModal.user}
          onCancel={() =>
            setPermissionModal({
              visible: false,
              user: null,
            })
          }
          onSuccess={() => {
            setPermissionModal({
              visible: false,
              user: null,
            });
            queryClient.invalidateQueries({ queryKey: ["users"] });
          }}
        />
      </Card>
    </div>
  );
};

export default UsersPage;
