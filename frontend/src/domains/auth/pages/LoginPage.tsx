import { Form, Input, Button, Typography, Alert } from 'antd';
import { Link } from 'react-router-dom';
import { useLogin } from '../hooks/useLogin';

export function LoginPage() {
  const { submit, error, loading } = useLogin();

  const onFinish = ({ email, password }: { email: string; password: string }) => {
    submit(email, password);
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
      <Typography.Title level={3}>Login</Typography.Title>
      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
          <Input placeholder="you@example.com" />
        </Form.Item>
        <Form.Item name="password" label="Password" rules={[{ required: true }]}>
          <Input.Password placeholder="Password" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Login
          </Button>
        </Form.Item>
      </Form>
      <Typography.Text>
        <Link to="/signup">Don't have an account? Sign up</Link>
      </Typography.Text>
    </div>
  );
}
