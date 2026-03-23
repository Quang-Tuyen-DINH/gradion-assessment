import { Form, Input, Button, Typography, Alert } from 'antd';
import { Link } from 'react-router-dom';
import { useSignup } from '../hooks/useSignup';

export function SignupPage() {
  const { submit, error, loading } = useSignup();

  const onFinish = ({ email, password }: { email: string; password: string }) => {
    submit(email, password);
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
      <Typography.Title level={3}>Sign Up</Typography.Title>
      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
          <Input placeholder="you@example.com" />
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, min: 8, message: 'Password must be at least 8 characters' }]}
        >
          <Input.Password placeholder="Min 8 characters" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Sign Up
          </Button>
        </Form.Item>
      </Form>
      <Typography.Text>
        <Link to="/login">Already have an account? Login</Link>
      </Typography.Text>
    </div>
  );
}
