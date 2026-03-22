import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReports } from '../hooks/useReports';
import { createReport } from '../api/reports';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import type { ReportStatus } from '../../../shared/types';

export function ReportsPage() {
  const [filter, setFilter] = useState<ReportStatus | ''>('');
  const { reports, loading, error, refetch } = useReports(filter || undefined);
  const navigate = useNavigate();

  const handleCreate = async () => {
    const title = prompt('Report title:');
    if (!title?.trim()) return;
    const report = await createReport(title.trim());
    navigate(`/reports/${report.id}`);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>My Reports</h2>
        <button onClick={handleCreate}>+ New Report</button>
      </div>
      <select
        value={filter}
        onChange={e => setFilter(e.target.value as ReportStatus | '')}
        style={{ marginBottom: 16 }}
      >
        <option value="">All statuses</option>
        {(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'] as ReportStatus[]).map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      {reports.length === 0 && <p style={{ color: '#9ca3af' }}>No reports found.</p>}
      {reports.map(r => (
        <div
          key={r.id}
          onClick={() => navigate(`/reports/${r.id}`)}
          style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 8, cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>{r.title}</strong>
            <StatusBadge status={r.status} />
          </div>
          <p style={{ color: '#6b7280', fontSize: 14, margin: '4px 0 0' }}>
            Total: ${Number(r.totalAmount).toFixed(2)}
          </p>
        </div>
      ))}
    </div>
  );
}
