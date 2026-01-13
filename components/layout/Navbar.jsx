"use client";

import React, { useState, useEffect } from "react";
import { Layout, Menu, Button } from "antd";
import {
  DashboardOutlined,
  FileTextOutlined,
  FolderOutlined,
  UserOutlined,
  TagsOutlined,
  TeamOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BarChartOutlined,
  BookOutlined,
  ShoppingCartOutlined,
  GiftOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import {
  getCurrentUser,
  hasPermission,
  PERMISSIONS,
} from "@/utils/permissions";

const { Sider } = Layout;

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  // Menu items configuration with permissions
  const getMenuItems = () => {
    if (!currentUser) return [];

    const items = [];

    // Dashboard - All CMS roles can access
    items.push({
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard & Báo cáo",
      children: [
        {
          key: "/dashboard",
          label: "Tổng quan",
          icon: <BarChartOutlined />,
        },
        ...(hasPermission(currentUser, PERMISSIONS.VIEW_ANALYTICS)
          ? [
              {
                key: "/dashboard/analytics",
                label: "Phân tích chi tiết",
                icon: <BarChartOutlined />,
              },
            ]
          : []),
      ],
    });

    // Users Management - Only admin, employee can view
    if (hasPermission(currentUser, PERMISSIONS.VIEW_USERS)) {
      const userChildren = [];

      if (hasPermission(currentUser, PERMISSIONS.VIEW_USERS)) {
        userChildren.push({
          key: "/users",
          label: "Danh sách người dùng",
          icon: <UserOutlined />,
        });
      }

      // Customers - employee, admin can view
      if (
        hasPermission(currentUser, PERMISSIONS.VIEW_ORDERS) ||
        currentUser.role === "employee" ||
        currentUser.role === "admin"
      ) {
        userChildren.push({
          key: "/customers",
          label: "Quản lý Khách hàng",
          icon: <UserOutlined />,
        });
      }

      if (userChildren.length > 0) {
        items.push({
          key: "users",
          icon: <TeamOutlined />,
          label: "Quản lý Người dùng",
          children: userChildren,
        });
      }
    }

    // Orders - employee, admin can view
    if (hasPermission(currentUser, PERMISSIONS.VIEW_ORDERS)) {
      items.push({
        key: "orders",
        icon: <ShoppingCartOutlined />,
        label: "Quản lý Đơn hàng",
        children: [
          {
            key: "/orders",
            label: "Danh sách đơn hàng",
            icon: <ShoppingCartOutlined />,
          },
        ],
      });
    }

    // Products Management
    if (hasPermission(currentUser, PERMISSIONS.VIEW_PRODUCTS)) {
      const productChildren = [];

      productChildren.push({
        key: "/products",
        label: "Sản phẩm",
        icon: <BookOutlined />,
      });

      if (hasPermission(currentUser, PERMISSIONS.VIEW_CATEGORIES)) {
        productChildren.push({
          key: "/categories",
          label: "Danh mục",
          icon: <FolderOutlined />,
        });
      }

      if (hasPermission(currentUser, PERMISSIONS.VIEW_BRANDS)) {
        productChildren.push({
          key: "/brands",
          label: "Thương hiệu",
          icon: <TagsOutlined />,
        });
      }

      if (hasPermission(currentUser, PERMISSIONS.MANAGE_PRODUCT_GROUPS)) {
        productChildren.push({
          key: "/product-groups",
          label: "Combo/Bộ PC",
          icon: <ShoppingCartOutlined />,
        });
      }

      if (productChildren.length > 0) {
        items.push({
          key: "products",
          icon: <FileTextOutlined />,
          label: "Quản lý Sản phẩm",
          children: productChildren,
        });
      }
    }

    // Voucher Management - employee and admin only
    if (hasPermission(currentUser, PERMISSIONS.VIEW_COUPONS)) {
      const voucherChildren = [];

      voucherChildren.push({
        key: "/promo-codes",
        label: "Mã khuyến mãi",
        icon: <GiftOutlined />,
      });

      voucherChildren.push({
        key: "/voucher-rules",
        label: "Quy tắc tự động",
        icon: <SettingOutlined />,
      });

      if (voucherChildren.length > 0) {
        items.push({
          key: "vouchers",
          icon: <GiftOutlined />,
          label: "Quản lý Khuyến mãi",
          children: voucherChildren,
        });
      }
    }

    return items;
  };

  const menuItems = getMenuItems();

  // Get all parent keys that have children (for default open state)
  const getAllParentKeys = () => {
    return menuItems
      .filter((item) => item.children && item.children.length > 0)
      .map((item) => item.key);
  };

  // Auto-detect current page and set selected keys
  const getCurrentMenuState = () => {
    const selectedKeys = [];

    // First, try to find an exact match within children
    for (const item of menuItems) {
      if (item.children) {
        for (const child of item.children) {
          if (pathname === child.key) {
            selectedKeys.push(child.key);
            return { selectedKeys }; // Found exact match, return early
          }
        }
      }
    }

    // If no exact child match, try to find a parent match based on pathname prefix
    for (const item of menuItems) {
      if (item.children && item.children.length > 0) {
        const defaultChildKey = item.children[0].key;
        if (pathname.startsWith(defaultChildKey)) {
          selectedKeys.push(defaultChildKey);
          return { selectedKeys };
        }
      }
    }

    // Fallback for the root path (handled by useEffect redirecting to /dashboard)
    if (pathname === "/") {
      selectedKeys.push("/dashboard");
    }

    return { selectedKeys };
  };

  const [collapsed, setCollapsed] = useState(false);
  // Default: open all parent menu items
  const [openKeys, setOpenKeys] = useState(() => {
    return getAllParentKeys();
  });

  const { selectedKeys } = getCurrentMenuState();

  // Initialize openKeys when menuItems change (when user logs in)
  useEffect(() => {
    const allParentKeys = getAllParentKeys();
    if (allParentKeys.length > 0) {
      setOpenKeys(allParentKeys);
    }
  }, [currentUser]);

  // Redirect from / to /dashboard
  useEffect(() => {
    if (pathname === "/") {
      router.push("/dashboard");
    }
  }, [pathname, router]);

  const handleMenuClick = ({ key }) => {
    if (key.startsWith("/")) {
      router.push(key);
    }
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      className="!bg-white border-r border-gray-200 shadow-sm"
      width={280}
    >
      {/* Logo Section */}
      <div
        className={`flex items-center justify-between p-4  relative ${
          collapsed ? "!justify-center" : ""
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">PC</span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-gray-800">CMS</h1>
              <p className="text-xs text-gray-500">Content Management System</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-150px)]">
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onOpenChange={setOpenKeys}
          items={menuItems}
          onClick={handleMenuClick}
          className="border-0"
          style={{
            backgroundColor: "transparent",
          }}
        />
      </div>

      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => setCollapsed(!collapsed)}
        className={`text-gray-500 hover:text-gray-700 shrink-0  !absolute bottom-4 right-6 ${
          collapsed ? "" : ""
        }`}
      />
    </Sider>
  );
};

export default Navbar;
