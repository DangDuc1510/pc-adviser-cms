"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, Button, Checkbox, Divider, message } from "antd";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  UserAddOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import MainLayout from "@/components/layout/MainLayout";
import Link from "next/link";
import { AuthApi } from "@/apis/auth";

const RegisterPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const router = useRouter();

  const handleRegister = async () => {
    try {
      await form.validateFields();
      setLoading(true);
      const values = form.getFieldsValue();

      // Remove confirmPassword from the data sent to API
      const { confirmPassword, ...registerData } = values;

      const response = await AuthApi.register(registerData);
      messageApi.success("Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error) {
      if (error.response?.data?.message) {
        messageApi.error(error.response.data.message);
      } else if (error.errorFields) {
        messageApi.error("Vui lòng kiểm tra lại thông tin đăng ký!");
      } else {
        messageApi.error("Đăng ký thất bại. Vui lòng thử lại!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <div className="min-h-screen bg-gradient-to-br from-white via-35% via-white to-primary flex items-center justify-center">
        <MainLayout>
          <div className="shadow-xl rounded-2xl bg-white !py-8 !px-6 flex flex-col items-center sm:w-[600px]">
            <p className={"text-3xl font-semibold"}>Đăng ký</p>
            <p className={"mt-2 text-gray-600"}>
              Tạo tài khoản mới để sử dụng dịch vụ
            </p>
            <Form
              form={form}
              name="register"
              layout="vertical"
              size="large"
              className="!space-y-4 !mt-6 w-full"
            >
              <Form.Item
                name="userName"
                label="Tên đăng nhập"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập tên đăng nhập!",
                  },
                  {
                    min: 3,
                    max: 20,
                    message: "Tên đăng nhập phải có 3-20 ký tự!",
                  },
                  {
                    pattern: /^[a-zA-Z0-9_]+$/,
                    message:
                      "Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới!",
                  },
                ]}
              >
                <Input
                  prefix={<UserOutlined className="text-gray-400" />}
                  placeholder="Nhập tên đăng nhập"
                  className="rounded-lg"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  autoComplete="new-password"
                />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập email!",
                  },
                  {
                    type: "email",
                    message: "Email không hợp lệ!",
                  },
                ]}
              >
                <Input
                  prefix={<MailOutlined className="text-gray-400" />}
                  placeholder="Nhập địa chỉ email"
                  className="rounded-lg"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  autoComplete="email"
                />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập số điện thoại!",
                  },
                  {
                    pattern: /^[+]?[\d\s-()]+$/,
                    message: "Số điện thoại không hợp lệ!",
                  },
                ]}
              >
                <Input
                  prefix={<PhoneOutlined className="text-gray-400" />}
                  placeholder="Nhập số điện thoại"
                  className="rounded-lg"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  autoComplete="tel"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="Mật khẩu"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập mật khẩu!",
                  },
                  {
                    min: 6,
                    message: "Mật khẩu phải có ít nhất 6 ký tự!",
                  },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="Nhập mật khẩu"
                  className="rounded-lg"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  autoComplete="new-password"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Xác nhận mật khẩu"
                dependencies={["password"]}
                rules={[
                  {
                    required: true,
                    message: "Vui lòng xác nhận mật khẩu!",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("Mật khẩu xác nhận không khớp!")
                      );
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="Nhập lại mật khẩu"
                  className="rounded-lg"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  autoComplete="new-password"
                />
              </Form.Item>

              <Form.Item
                name="agreeTerms"
                valuePropName="checked"
                rules={[
                  {
                    validator: (_, value) =>
                      value
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error("Vui lòng đồng ý với điều khoản sử dụng!")
                          ),
                  },
                ]}
              >
                <Checkbox>
                  Tôi đồng ý với{" "}
                  <Link href={"#"} className="!text-primary hover:!underline">
                    Điều khoản sử dụng
                  </Link>{" "}
                  và{" "}
                  <Link href={"#"} className="!text-primary hover:!underline">
                    Chính sách bảo mật
                  </Link>
                </Checkbox>
              </Form.Item>

              <Form.Item className="mb-4">
                <Button
                  type="primary"
                  onClick={handleRegister}
                  loading={loading}
                  className="w-full h-12 rounded-lg"
                >
                  {loading ? "Đang đăng ký..." : "Đăng ký"}
                </Button>
              </Form.Item>
            </Form>

            <Divider className="my-6">
              <p>hoặc</p>
            </Divider>

            <div className="text-center">
              <p className="text-gray-600 text-sm">
                Đã có tài khoản?
                <Link
                  href={"/login"}
                  className="!pl-2 !text-primary hover:!underline !font-semibold"
                >
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </div>
        </MainLayout>
      </div>
    </>
  );
};

export default RegisterPage;
