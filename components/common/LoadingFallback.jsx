'use client';

import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const LoadingFallback = () => {
  const antIcon = <LoadingOutlined style={{ fontSize: 48, color: '#1890ff' }} spin />;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F5F5F5',
        padding: '24px',
      }}
    >
      <div
        style={{
          textAlign: 'center',
        }}
      >
        <Spin indicator={antIcon} size="large" />
        <div
          style={{
            marginTop: 24,
            fontSize: 16,
            color: '#666',
            fontWeight: 500,
          }}
        >
          Đang tải...
        </div>
      </div>
    </div>
  );
};

export default LoadingFallback;
