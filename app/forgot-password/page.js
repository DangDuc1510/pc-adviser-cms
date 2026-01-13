'use client'
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {Form, Input, Button, message, Result} from 'antd';
import {MailOutlined, ArrowLeftOutlined} from '@ant-design/icons';
import MainLayout from "@/components/layout/MainLayout";
import Link from "next/link";
import { AuthApi } from '@/apis/auth';

const ForgotPasswordPage = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();
    const [emailSent, setEmailSent] = useState(false);
    const [sentEmail, setSentEmail] = useState('');
    const router = useRouter();

    const handleForgotPassword = async () => {
        try {
            await form.validateFields();
            setLoading(true);
            const values = form.getFieldsValue();
            
            const response = await AuthApi.forgotPassword(values);
            setSentEmail(values.email);
            setEmailSent(true);
            messageApi.success('Email khôi phục mật khẩu đã được gửi!');

        } catch (error) {
            if (error.response?.data?.message) {
                messageApi.error(error.response.data.message);
            } else if (error.errorFields) {
                messageApi.error('Vui lòng kiểm tra lại thông tin!');
            } else {
                messageApi.error('Gửi email thất bại. Vui lòng thử lại!');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendEmail = async () => {
        setLoading(true);
        try {
            const response = await AuthApi.forgotPassword({ email: sentEmail });
            messageApi.success('Email khôi phục mật khẩu đã được gửi lại!');
        } catch (error) {
            messageApi.error('Gửi lại email thất bại. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    if (emailSent) {
        return (
            <>
                {contextHolder}
                <div className="min-h-screen bg-gradient-to-br from-white via-35% via-white to-primary flex items-center justify-center">
                    <MainLayout>
                        <div className="shadow-xl rounded-2xl bg-white !py-8 !px-6 flex flex-col items-center max-w-md">
                            <Result
                                status="success"
                                title="Email đã được gửi!"
                                subTitle={
                                    <div className="text-gray-600">
                                        <p>Chúng tôi đã gửi hướng dẫn khôi phục mật khẩu đến:</p>
                                        <p className="font-semibold text-primary mt-2">{sentEmail}</p>
                                        <p className="mt-2">Vui lòng kiểm tra hộp thư của bạn và làm theo hướng dẫn.</p>
                                    </div>
                                }
                                extra={[
                                    <Button
                                        key="resend"
                                        onClick={handleResendEmail}
                                        loading={loading}
                                        className="rounded-lg"
                                    >
                                        {loading ? 'Đang gửi lại...' : 'Gửi lại email'}
                                    </Button>,
                                    <Button
                                        key="back"
                                        type="primary"
                                        onClick={() => router.push('/login')}
                                        className="rounded-lg"
                                    >
                                        Về trang đăng nhập
                                    </Button>,
                                ]}
                            />
                        </div>
                    </MainLayout>
                </div>
            </>
        );
    }

    return (
        <>
            {contextHolder}
            <div className="min-h-screen bg-gradient-to-br from-white via-35% via-white to-primary flex items-center justify-center">
                <MainLayout>
                    <div className="shadow-xl rounded-2xl bg-white !py-8 !px-6 flex flex-col items-center sm:w-[600px]">
                        <p className={'text-3xl font-semibold'}>Quên mật khẩu</p>
                        <p className={'mt-2 text-gray-600 text-center'}>
                            Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn khôi phục mật khẩu
                        </p>
                        
                        <Form
                            form={form}
                            name="forgotPassword"
                            layout="vertical"
                            size="large"
                            className="!space-y-4 !mt-6 w-full"
                        >
                            <Form.Item
                                name="email"
                                label="Email"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Vui lòng nhập email!',
                                    },
                                    {
                                        type: 'email',
                                        message: 'Email không hợp lệ!',
                                    },
                                ]}
                            >
                                <Input
                                    prefix={<MailOutlined className="text-gray-400"/>}
                                    placeholder="Nhập địa chỉ email của bạn"
                                    className="rounded-lg"
                                />
                            </Form.Item>

                            <Form.Item className="mb-4">
                                <Button
                                    type="primary"
                                    onClick={handleForgotPassword}
                                    loading={loading}
                                    className="w-full h-12 rounded-lg"
                                >
                                    {loading ? 'Đang gửi...' : 'Gửi email khôi phục'}
                                </Button>
                            </Form.Item>
                        </Form>

                        <div className="text-center mt-6">
                            <Link
                                href={'/login'}
                                className="inline-flex items-center !text-primary hover:!underline !font-semibold"
                            >
                                <ArrowLeftOutlined className="mr-2" />
                                Quay lại đăng nhập
                            </Link>
                        </div>

                        <div className="text-center mt-6">
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

                        <div className="text-center mt-4">
                            <p className="text-gray-500 text-sm">
                                Bằng việc sử dụng dịch vụ, bạn đồng ý với{' '}
                                <Link href={'#'} className="!text-primary hover:!underline">
                                    Điều khoản sử dụng
                                </Link>{' '}
                                và{' '}
                                <Link href={'#'} className="!text-primary hover:!underline">
                                    Chính sách bảo mật
                                </Link>
                            </p>
                        </div>
                    </div>
                </MainLayout>
            </div>
        </>
    );
};

export default ForgotPasswordPage; 