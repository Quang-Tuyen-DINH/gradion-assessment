import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Select, Modal, Form, Input, Space, Popconfirm, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useReports } from '../hooks/useReports';
import { createReport, deleteReport } from '../api/reports';
import { getAdminReports } from '../../admin/api/admin';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { isAdmin } from '../../../shared/utils/auth';
import type { ReportStatus } from '../../../shared/types';

const { Option } = Select;

export function ReportsPage() {
  const navigate = useNavigate();
  const admin = isAdmin();
  const [refreshKey, setRefreshKey] = useState(0);

  // User reports
  const [filter, setFilter] = useState<ReportStatus | undefined>(undefined);
  const { reports: userReports, loading: userLoading, error } = useReports(
    admin ? undefined : filter,
  );

  // Admin reports
  const [adminReports, setAdminReports] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminFilter, setAdminFilter] = useState<ReportStatus | undefined>(undefined);

  const loadAdmin = useCallback(() => {
    setAdminLoading(true);
    getAdminReports(adminFilter)
      .then((d) => setAdminReports(d.data ?? d))
      .catch(() => {})
      .finally(() => setAdminLoading(false));
  }, [adminFilter]);

  useEffect(() => {
    if (admin) loadAdmin();
  }, [admin, loadAdmin, refreshKey]);

  // New report modal
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [creating, setCreating] = useState(false);

  const handleCreate = async (values: { title: string; description?: string }) => {
    setCreating(true);
    try {
      const report = await createReport(values.title.trim(), values.description?.trim());
      setModalOpen(false);
      form.resetFields();
      navigate(`/reports/${report.id}`);
    } catch {
      // error handled by API layer
    } finally {
      setCreating(false);
    }
  };

  const statuses: ReportStatus[] = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'];

  const userColumns = [
    { title: 'Title', dataIndex: 'title', key: 'title' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: ReportStatus) => <StatusBadge status={s} />,
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v: number) => `$${Number(v).toFixed(2)}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: any) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/reports/${record.id}`)}>
            View
          </Button>
          {record.status === 'DRAFT' && (
            <Popconfirm
              title="Delete this report?"
              onConfirm={async () => {
                await deleteReport(record.id);
                setRefreshKey((k) => k + 1);
              }}
            >
              <Button type="link" danger>
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const adminColumns = [
    { title: 'Title', dataIndex: 'title', key: 'title' },
    {
      title: 'User',
      key: 'user',
      render: (_: unknown, record: any) => record.user?.email ?? '—',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: ReportStatus) => <StatusBadge status={s} />,
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v: number) => `$${Number(v).toFixed(2)}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: any) => (
        <Button type="link" onClick={() => navigate(`/reports/${record.id}`)}>
          View
        </Button>
      ),
    },
  ];

  if (!admin && error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Typography.Title level={3} style={{ margin: 0 }}>
          {admin ? 'All Reports' : 'My Reports'}
        </Typography.Title>
        {!admin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            New Report
          </Button>
        )}
      </div>

      <Select
        placeholder="All statuses"
        allowClear
        style={{ width: 180, marginBottom: 16 }}
        value={admin ? adminFilter : filter}
        onChange={(v) => (admin ? setAdminFilter(v) : setFilter(v))}
      >
        {statuses.map((s) => (
          <Option key={s} value={s}>
            {s}
          </Option>
        ))}
      </Select>

      <Table
        rowKey="id"
        columns={admin ? adminColumns : userColumns}
        dataSource={admin ? adminReports : userReports}
        loading={admin ? adminLoading : userLoading}
        onRow={(record) => ({
          onClick: (e) => {
            if (
              (e.target as HTMLElement).tagName !== 'BUTTON' &&
              !(e.target as HTMLElement).closest('button')
            ) {
              navigate(`/reports/${record.id}`);
            }
          },
          style: { cursor: 'pointer' },
        })}
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title="New Report"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={creating}
        okText="Create"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, max: 255, message: 'Title is required (max 255 chars)' }]}
          >
            <Input placeholder="Q1 Travel Expenses" />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ max: 2000 }]}>
            <Input.TextArea rows={3} placeholder="Optional description" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
