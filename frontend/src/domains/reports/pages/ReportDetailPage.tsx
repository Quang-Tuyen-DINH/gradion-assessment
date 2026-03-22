import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReport, submitReport, returnToDraft, deleteReport } from '../api/reports';
import { updateItem, deleteItem } from '../../items/api/items';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { ItemForm } from '../../items/components/ItemForm';
import { ItemList } from '../../items/components/ItemList';

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const reload = useCallback(() => {
    setLoading(true);
    getReport(id!)
      .then(setReport)
      .catch(() => setError('Failed to load report'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { reload(); }, [reload]);

  if (loading) return <LoadingSpinner />;
  if (error || !report) return <p style={{ color: 'red' }}>{error || 'Report not found'}</p>;

  const isDraft = report.status === 'DRAFT';
  const isRejected = report.status === 'REJECTED';

  const handleSubmit = async () => {
    setActionError('');
    try {
      await submitReport(id!);
      reload();
    } catch {
      setActionError('Failed to submit report');
    }
  };

  const handleReturnToDraft = async () => {
    setActionError('');
    try {
      await returnToDraft(id!);
      reload();
    } catch {
      setActionError('Failed to return to draft');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this report?')) return;
    try {
      await deleteReport(id!);
      navigate('/reports');
    } catch {
      setActionError('Failed to delete report');
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <button onClick={() => navigate('/reports')} style={{ marginBottom: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}>
        ← Back to reports
      </button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>{report.title}</h2>
        <StatusBadge status={report.status} />
      </div>
      {report.description && <p style={{ color: '#6b7280' }}>{report.description}</p>}
      <p style={{ fontWeight: 600 }}>Total: ${Number(report.totalAmount).toFixed(2)}</p>

      {actionError && <p style={{ color: 'red' }}>{actionError}</p>}

      <ItemList
        items={report.items ?? []}
        canEdit={isDraft}
        onDelete={async (itemId) => { await deleteItem(id!, itemId); reload(); }}
        onUpdate={async (itemId, data) => { await updateItem(id!, itemId, data); reload(); }}
      />

      {isDraft && (
        <>
          <ItemForm reportId={id!} onSaved={reload} />
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button onClick={handleSubmit}>Submit Report</button>
            <button onClick={handleDelete} style={{ color: 'red', background: 'none', border: '1px solid red' }}>
              Delete Report
            </button>
          </div>
        </>
      )}

      {isRejected && (
        <button
          onClick={handleReturnToDraft}
          style={{ marginTop: 16, background: '#f59e0b', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}
        >
          Return to Draft
        </button>
      )}
    </div>
  );
}
