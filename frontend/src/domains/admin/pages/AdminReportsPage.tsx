import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminReports } from '../api/admin';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import type { ReportStatus } from '../../../shared/types';

export function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [filter, setFilter] = useState<ReportStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = useCallback(() => {
    setLoading(true);
    getAdminReports(filter || undefined)
      .then(d => setReports(d.data ?? d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <h2>Admin — All Reports</h2>
      <select value={filter} onChange={e => setFilter(e.target.value as ReportStatus | '')} style={{ marginBottom: 16 }}>
        <option value="">All statuses</option>
        {(['DRAFT','SUBMITTED','APPROVED','REJECTED'] as ReportStatus[]).map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      {reports.length === 0 && <p style={{ color: '#9ca3af' }}>No reports found.</p>}
      {reports.map((r: any) => (
        <div key={r.id} onClick={() => navigate(`/admin/reports/${r.id}`)}
          style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 8, cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{r.title}</strong>
              <span style={{ marginLeft: 12, color: '#6b7280', fontSize: 13 }}>{r.user?.email ?? ''}</span>
            </div>
            <StatusBadge status={r.status} />
          </div>
          <p style={{ color: '#6b7280', fontSize: 14, margin: '4px 0 0' }}>Total: ${Number(r.totalAmount).toFixed(2)}</p>
        </div>
      ))}
    </div>
  );
}
