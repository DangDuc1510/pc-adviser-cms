"use client";

import React, { useState, useEffect } from "react";
import { Modal, Checkbox, Row, Col, message, Divider, Tag } from "antd";
import { useQuery } from "@tanstack/react-query";
import { UserApi } from "@/apis/auth";

const PERMISSION_GROUPS = {
  "Quản lý người dùng": [
    "view_users",
    "create_users",
    "edit_users",
    "delete_users",
    "manage_user_roles",
  ],
  "Quản lý sản phẩm": [
    "view_products",
    "create_products",
    "edit_products",
    "delete_products",
    "manage_inventory",
    "view_product_analytics",
  ],
  "Quản lý danh mục & thương hiệu": [
    "view_categories",
    "manage_categories",
    "view_brands",
    "manage_brands",
    "manage_product_groups",
  ],
  "Quản lý đơn hàng": [
    "view_orders",
    "create_orders",
    "edit_orders",
    "cancel_orders",
    "manage_order_status",
    "process_refunds",
  ],
  "Smart Builder": [
    "view_builds",
    "create_builds",
    "manage_compatibility_rules",
  ],
  "Hệ thống & Báo cáo": [
    "view_system_logs",
    "view_analytics",
    "manage_notifications",
  ],
};

const PERMISSION_LABELS = {
  view_users: "Xem người dùng",
  create_users: "Tạo người dùng",
  edit_users: "Sửa người dùng",
  delete_users: "Xóa người dùng",
  manage_user_roles: "Quản lý vai trò",
  view_products: "Xem sản phẩm",
  create_products: "Tạo sản phẩm",
  edit_products: "Sửa sản phẩm",
  delete_products: "Xóa sản phẩm",
  manage_inventory: "Quản lý tồn kho",
  view_product_analytics: "Xem phân tích sản phẩm",
  view_categories: "Xem danh mục",
  manage_categories: "Quản lý danh mục",
  view_brands: "Xem thương hiệu",
  manage_brands: "Quản lý thương hiệu",
  manage_product_groups: "Quản lý Combo/Bộ PC",
  view_orders: "Xem đơn hàng",
  create_orders: "Tạo đơn hàng",
  edit_orders: "Sửa đơn hàng",
  cancel_orders: "Hủy đơn hàng",
  manage_order_status: "Quản lý trạng thái đơn",
  process_refunds: "Xử lý hoàn tiền",
  view_builds: "Xem cấu hình",
  create_builds: "Tạo cấu hình",
  manage_compatibility_rules: "Quản lý quy tắc tương thích",
  view_system_logs: "Xem log hệ thống",
  view_analytics: "Xem phân tích",
  manage_notifications: "Quản lý thông báo",
};

const PermissionManager = ({ visible, user, onCancel, onSuccess }) => {
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [saving, setSaving] = useState(false);
  // Query for role permissions
  const { data: rolePermissionsData, isLoading: isLoadingRolePermissions } =
    useQuery({
      queryKey: ["permissions", "role", user?.role],
      queryFn: async () => {
        const rolePermsResponse = await UserApi.getRolePermissions(user.role);
        return rolePermsResponse.permissions;
      },
      enabled: visible && !!user,
    });

  const rolePermissions = rolePermissionsData || [];

  // Initialize selected permissions from user
  useEffect(() => {
    if (user?.customPermissions) {
      setSelectedPermissions(user.customPermissions);
    }
  }, [user]);

  const handlePermissionChange = (permission, checked) => {
    if (checked) {
      setSelectedPermissions([...selectedPermissions, permission]);
    } else {
      setSelectedPermissions(
        selectedPermissions.filter((p) => p !== permission)
      );
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await UserApi.updateUserPermissions(user._id, selectedPermissions);
      messageApi.success("Cập nhật quyền thành công");
      onSuccess();
    } catch (error) {
      messageApi.error(error.response?.data?.message || "Có lỗi xảy ra");
      console.error("Error updating permissions:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {contextHolder}
      <Modal
        title={`Quản lý quyền - ${user?.userName || user?.email}`}
        open={visible}
        onCancel={onCancel}
        onOk={handleSave}
        confirmLoading={isLoadingRolePermissions || saving}
        width={800}
        okText="Lưu"
        cancelText="Hủy"
      >
        <div className="mb-4">
          <Tag color="blue">Vai trò: {user?.role}</Tag>
          <p className="text-sm text-gray-500 mt-2">
            Quyền từ vai trò (không thể thay đổi): {rolePermissions.length}{" "}
            quyền
          </p>
          <p className="text-sm text-gray-500">
            Quyền tùy chỉnh: {selectedPermissions.length} quyền
          </p>
        </div>

        <Divider>Quyền tùy chỉnh</Divider>

        {Object.entries(PERMISSION_GROUPS).map(([groupName, permissions]) => (
          <div key={groupName} className="mb-4">
            <h4 className="font-semibold mb-2">{groupName}</h4>
            <Row gutter={[16, 16]}>
              {permissions.map((permission) => {
                const isRolePermission = rolePermissions.includes(permission);
                const isChecked =
                  selectedPermissions.includes(permission) || isRolePermission;

                return (
                  <Col span={12} key={permission}>
                    <Checkbox
                      checked={isChecked}
                      disabled={isRolePermission}
                      onChange={(e) =>
                        handlePermissionChange(permission, e.target.checked)
                      }
                    >
                      {PERMISSION_LABELS[permission]}
                      {isRolePermission && (
                        <Tag color="green" className="ml-2">
                          Từ vai trò
                        </Tag>
                      )}
                    </Checkbox>
                  </Col>
                );
              })}
            </Row>
          </div>
        ))}
      </Modal>
    </>
  );
};

export default PermissionManager;
