'use client'
import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Form, Input, Button, Divider, message, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import MainLayout from "@/components/layout/MainLayout";
import Link from "next/link";
import { AuthApi } from '@/apis/auth';
import { ACCESS_TOKEN, USER_INFO } from '@/config/constants';
import LoadingFallback from '@/components/common/LoadingFallback';

const LoginPageContent = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();
    const [showUnauthorizedAlert, setShowUnauthorizedAlert] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const error = searchParams.get('error');
        if (error === 'unauthorized') {
            setShowUnauthorizedAlert(true);
        }
    }, [searchParams]);

    const handleLogin = async () => {
        setLoading(true);
        const values = form.getFieldsValue();
        try {
            const response = await AuthApi.login(values);
            localStorage.setItem(ACCESS_TOKEN, response?.token);
            localStorage.setItem(USER_INFO, JSON.stringify(response?.user));
            messageApi.success('Đăng nhập thành công!');
            router.push('/');

        } catch (error) {
            messageApi.error(error.response.data.message);
        } finally {
            setLoading(false);
        }
    };


    return (
        <>
            {contextHolder}
            <div className="w-full min-h-screen bg-gradient-to-br from-white via-35% via-white to-primary flex items-center justify-center">
                <MainLayout>
                    <div className="shadow-xl rounded-2xl bg-white !py-8 !px-6 flex flex-col items-center sm:w-[500px]">
                        <p className={'text-2xl font-semibold'}>Chào mừng đến với PC Adviser CMS</p>
                        
                        {showUnauthorizedAlert && (
                            <Alert
                                message="Bạn không có quyền truy cập CMS"
                                description="Chỉ có admin và employee mới có thể truy cập vào hệ thống CMS. Vui lòng đăng nhập bằng tài khoản có vai trò phù hợp."
                                type="warning"
                                showIcon
                                closable
                                onClose={() => setShowUnauthorizedAlert(false)}
                                className="w-full mb-4"
                            />
                        )}
                        
                        <Form
                            form={form}
                            name="login"
                            layout="vertical"
                            size="large"
                            className="!space-y-4 !mt-6 w-full"
                        >
                            <Form.Item
                                name="emailOrUsername"
                                label="Email hoặc tên đăng nhập"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Vui lòng nhập email hoặc tên đăng nhập!',
                                    },
                                ]}
                            >
                                <Input
                                    prefix={<UserOutlined className="text-gray-400" />}
                                    placeholder="Email hoặc tên đăng nhập"
                                    className="rounded-lg"
                                    autoComplete="new-password"
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                    spellCheck="false"
                                />
                            </Form.Item>

                            <Form.Item
                                name="password"
                                label="Mật khẩu"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Vui lòng nhập mật khẩu!',
                                    }
                                ]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined className="text-gray-400" />}
                                    placeholder="Nhập mật khẩu"
                                    className="rounded-lg"
                                    autoComplete="new-password"
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                    spellCheck="false"
                                />
                            </Form.Item>

                            {/* <div className="flex justify-end !items-center mb-6">
                                <Link
                                    href={'/forgot-password'}
                                    className="!text-primary !font-semibold hover:!underline"
                                >
                                    Quên mật khẩu?
                                </Link>
                            </div> */}

                            <Form.Item className="mb-4 !mt-8">
                                <Button
                                    type="primary"
                                    onClick={handleLogin}
                                    loading={loading}
                                    className="w-full h-12 rounded-lg "
                                >
                                    {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                                </Button>
                            </Form.Item>
                        </Form>

                        {/* <Divider className="my-6">
                            <p>hoặc</p>
                        </Divider> */}

                        {/* <div className="text-center">
                            <p className="text-gray-600 text-sm">
                                Chưa có tài khoản?
                                <Link
                                    href={'/register'}
                                    className="!pl-2 !text-primary hover:!underline !font-semibold"
                                >
                                    Đăng ký ngay
                                </Link>
                            </p>
                        </div>
                        <div className="text-center mt-6">
                            <p className="text-gray-500 text-sm">
                                Bằng việc đăng nhập, bạn đồng ý với <Link href={'#'} className="!text-primary hover:!underline ">Điều khoản sử dụng </Link> và <Link href={'#'} className="!text-primary hover:!underline">Chính sách bảo mật</Link>
                            </p>
                        </div> */}
                    </div>
                </MainLayout>
            </div>
        </>
    );
};

const LoginPage = () => {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <LoginPageContent />
        </Suspense>
    );
};

export default LoginPage;