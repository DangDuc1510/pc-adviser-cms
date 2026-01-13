'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';
import { ACCESS_TOKEN, USER_INFO } from '@/config/constants';

const ProtectedRoute = ({ children }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem(ACCESS_TOKEN);
        const userStr = localStorage.getItem(USER_INFO);

        if (!token || !userStr) {
          // No token or user info, redirect to login
          router.push('/login');
          return;
        }

        const userData = JSON.parse(userStr);
        
        // Check if user is allowed to access CMS (if required)
        const allowedCmsRoles = ['admin', 'employee'];
        if (!allowedCmsRoles.includes(userData.role)) {
          // Not an allowed CMS role, redirect to login with unauthorized message
          router.push('/login?error=unauthorized');
          return;
        }

        setUser(userData);
      } catch (error) {
        // Error parsing user data, redirect to login
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(USER_INFO);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return children;
};

export default ProtectedRoute;
