import { Layout, Menu, Button, Typography } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const { Header, Content } = Layout;

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const menuItems = [{ key: '/reports', label: 'Reports' }];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
        }}
      >
        <Typography.Text style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>
          Expense Reports
        </Typography.Text>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[location.pathname.startsWith('/reports') ? '/reports' : '']}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ background: 'transparent', borderBottom: 'none', minWidth: 120 }}
          />
          <Button type="text" style={{ color: '#fff' }} onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </Header>
      <Content style={{ padding: '24px', maxWidth: 960, margin: '0 auto', width: '100%' }}>
        <Outlet />
      </Content>
    </Layout>
  );
}
