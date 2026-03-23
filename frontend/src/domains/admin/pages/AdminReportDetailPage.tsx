import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAdminReport, approveReport, rejectReport } from '../api/admin';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import type { ReportStatus, ExpenseCategory } from '../../../shared/types';

interface ReportItem {
  id: string;
  amount: number | string;
  category: ExpenseCategory;
  merchantName?: string;
}

interface Report {
  id: string;
  title: string;
  status: ReportStatus;
  totalAmount: number | string;
  user?: { email: string };
  items?: ReportItem[];
}

export function AdminReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    setLoading(true);
    getAdminReport(id!)
      .then(setReport)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const reload = useCallback(() => {
    setLoading(true);
    getAdminReport(id!)
      .then(setReport)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!report) return <p style={{ color: 'red' }}>Report not found</p>;

  const isSubmitted = report.status === 'SUBMITTED';

  const handleApprove = async () => {
    setActionError('');
    try {
      await approveReport(id!);
      reload();
    } catch {
      setActionError('Failed to approve');
    }
  };

  const handleReject = async () => {
    setActionError('');
    try {
      await rejectReport(id!);
      reload();
    } catch {
      setActionError('Failed to reject');
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <button
        onClick={() => navigate('/admin/reports')}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#3b82f6',
          marginBottom: 16,
        }}
      >
        ← Back
      </button>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <h2 style={{ margin: 0 }}>{report.title}</h2>
        <StatusBadge status={report.status} />
      </div>
      <p style={{ color: '#6b7280' }}>Submitted by: {report.user?.email ?? 'Unknown'}</p>
      <p>
        <strong>Total: ${Number(report.totalAmount).toFixed(2)}</strong>
      </p>
      {actionError && <p style={{ color: 'red' }}>{actionError}</p>}
      <h3>Items</h3>
      {(report.items ?? []).length === 0 && <p style={{ color: '#9ca3af' }}>No items.</p>}
      {(report.items ?? []).map((item) => (
        <div
          key={item.id}
          style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 12, marginBottom: 8 }}
        >
          <strong>${Number(item.amount).toFixed(2)}</strong>
          {item.category && (
            <span style={{ marginLeft: 8, color: '#6b7280' }}>{item.category}</span>
          )}
          {item.merchantName && (
            <span style={{ marginLeft: 8, color: '#6b7280' }}>{item.merchantName}</span>
          )}
        </div>
      ))}
      {isSubmitted && (
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button
            onClick={handleApprove}
            style={{
              background: '#22c55e',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Approve
          </button>
          <button
            onClick={handleReject}
            style={{
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
