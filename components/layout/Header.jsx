'use client';

import React, { useState, useEffect } from 'react';
import { 
  Avatar, 
  Dropdown, 
  Badge, 
  Tooltip,
  Layout
} from 'antd';
import {
  UserOutlined,
  BellOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { ACCESS_TOKEN, USER_INFO, USER_ROLE_LABELS } from '@/config/constants';

const { Header: AntHeader } = Layout;

const Header = () => {
    const router = useRouter();
    const [user, setUser] = useState(null);

    // Function to get user from localStorage
    const getUserFromStorage = () => {
        if (typeof window !== 'undefined') {
            const userStr = localStorage.getItem(USER_INFO);
            if (userStr) {
                try {
                    return JSON.parse(userStr);
                } catch {
                    return null;
                }
            }
        }
        return null;
    };

    // Function to update user state
    const updateUserState = () => {
        const userData = getUserFromStorage();
        setUser(userData);
    };

    useEffect(() => {
        // Initial load
        updateUserState();

        // Listen for storage changes (when localStorage is updated from other components)
        const handleStorageChange = (e) => {
            if (e.key === USER_INFO) {
                updateUserState();
            }
        };

        // Listen for custom event (when localStorage is updated from same window)
        const handleUserUpdate = () => {
            updateUserState();
        };

        // Add event listeners
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('userInfoUpdated', handleUserUpdate);

        // Cleanup
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('userInfoUpdated', handleUserUpdate);
        };
    }, []);

    const userMenuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'Hồ sơ cá nhân',
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Đăng xuất',
        },
    ];

    const handleUserMenuClick = ({ key }) => {
        switch (key) {
            case 'profile':
                router.push('/profile');
                break;
            case 'settings':
                router.push('/settings');
                break;
            case 'logout':
                // Xóa token và user info, chuyển hướng về trang đăng nhập
                if (typeof window !== 'undefined') {
                    localStorage.removeItem(ACCESS_TOKEN);
                    localStorage.removeItem(USER_INFO);
                }
                router.push('/login');
                break;
            default:
                break;
        }
    };

    return (
        <AntHeader className="!bg-white border-b border-gray-200 shadow-sm flex items-center justify-end px-6 sticky top-0 z-50">
            <div className="flex items-center space-x-3">
                <Dropdown
                    menu={{
                        items: userMenuItems,
                        onClick: handleUserMenuClick,
                    }}
                    placement="bottomRight"
                    trigger={['click']}
                >
                    <div className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors w-full gap-2">
                        <Badge  size="small">
                           {user?.avatar ? <Avatar 
                                size={32} 
                                icon={<UserOutlined />}
                                className="!bg-gradient-to-r !from-blue-500 !to-teal-500"
                                src={user?.avatar}
                            /> : <Avatar 
                                size={32} 
                                icon={<UserOutlined />}
                                className="!bg-gradient-to-r !from-blue-500 !to-teal-500"
                            />}
                        </Badge>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                                {user?.userName || 'Chưa đăng nhập'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {USER_ROLE_LABELS?.[user?.role] || user?.role || ''}
                            </p>
                        </div>
                        {/* <Tooltip title="Thông báo">
                            <Badge count={5} size="small">
                                <BellOutlined className="text-gray-500 hover:text-gray-700" />
                            </Badge>
                        </Tooltip> */}
                    </div>
                </Dropdown>
            </div>
        </AntHeader>
    )
}

export default Header;