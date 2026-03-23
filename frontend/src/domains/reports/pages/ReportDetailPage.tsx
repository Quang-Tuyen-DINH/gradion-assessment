import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Descriptions, Space, Alert, Popconfirm, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { getReport, submitReport, returnToDraft, deleteReport } from '../api/reports';
import { getAdminReport, approveReport, rejectReport } from '../../admin/api/admin';
import { updateItem, deleteItem } from '../../items/api/items';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { ItemForm } from '../../items/components/ItemForm';
import { ItemList } from '../../items/components/ItemList';
import { isAdmin } from '../../../shared/utils/auth';

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const admin = isAdmin();

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const reload = useCallback(() => {
    setLoading(true);
    const fetch = admin ? getAdminReport(id!) : getReport(id!);
    fetch
      .then(setReport)
      .catch(() => setError('Failed to load report'))
      .finally(() => setLoading(false));
  }, [id, admin]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (loading) return <LoadingSpinner />;
  if (error || !report) return <Alert type="error" message={error || 'Report not found'} />;

  const isDraft = report.status === 'DRAFT';
  const isRejected = report.status === 'REJECTED';
  const isSubmitted = report.status === 'SUBMITTED';

  const withError = async (fn: () => Promise<void>, msg: string) => {
    setActionError('');
    try {
      await fn();
      reload();
    } catch {
      setActionError(msg);
    }
  };

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        type="link"
        onClick={() => navigate('/reports')}
        style={{ marginBottom: 16, paddingLeft: 0 }}
      >
        Back to reports
      </Button>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Typography.Title level={3} style={{ margin: 0 }}>
          {report.title}
        </Typography.Title>
        <StatusBadge status={report.status} />
      </div>

      {actionError && <Alert type="error" message={actionError} style={{ marginBottom: 16 }} />}

      <Descriptions bordered size="small" style={{ marginBottom: 24 }}>
        {report.description && (
          <Descriptions.Item label="Description" span={3}>
            {report.description}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Total">${Number(report.totalAmount).toFixed(2)}</Descriptions.Item>
        {admin && report.user && (
          <Descriptions.Item label="Submitted by">{report.user.email}</Descriptions.Item>
        )}
      </Descriptions>

      <Typography.Title level={5}>Items</Typography.Title>
      <ItemList
        items={report.items ?? []}
        canEdit={isDraft && !admin}
        onDelete={async (itemId) => {
          await deleteItem(id!, itemId);
          reload();
        }}
        onUpdate={async (itemId, data) => {
          await updateItem(id!, itemId, data);
          reload();
        }}
      />

      {isDraft && !admin && (
        <>
          <ItemForm reportId={id!} onSaved={reload} />
          <Space style={{ marginTop: 16 }}>
            <Button
              type="primary"
              onClick={() => withError(() => submitReport(id!), 'Failed to submit')}
            >
              Submit Report
            </Button>
            <Popconfirm
              title="Delete this report?"
              onConfirm={() =>
                withError(
                  async () => {
                    await deleteReport(id!);
                    navigate('/reports');
                  },
                  'Failed to delete',
                )
              }
            >
              <Button danger>Delete Report</Button>
            </Popconfirm>
          </Space>
        </>
      )}

      {isRejected && !admin && (
        <Button
          style={{ marginTop: 16 }}
          onClick={() => withError(() => returnToDraft(id!), 'Failed to return to draft')}
        >
          Return to Draft
        </Button>
      )}

      {isSubmitted && admin && (
        <Space style={{ marginTop: 16 }}>
          <Popconfirm
            title="Approve this report?"
            onConfirm={() => withError(() => approveReport(id!), 'Failed to approve')}
          >
            <Button type="primary">Approve</Button>
          </Popconfirm>
          <Popconfirm
            title="Reject this report?"
            onConfirm={() => withError(() => rejectReport(id!), 'Failed to reject')}
          >
            <Button danger>Reject</Button>
          </Popconfirm>
        </Space>
      )}
    </div>
  );
}
