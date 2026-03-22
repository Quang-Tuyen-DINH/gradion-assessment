import { useState, useEffect, useMemo, useCallback } from 'react';
import { getReports } from '../api/reports';

export function useReports(statusFilter?: string) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    getReports(statusFilter)
      .then(d => setReports(d.data ?? d))
      .catch(() => setError('Failed to load reports'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const sorted = useMemo(() => [...reports].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ), [reports]);

  return { reports: sorted, loading, error, refetch: load };
}
