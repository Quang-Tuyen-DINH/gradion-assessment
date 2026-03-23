import { useState, useEffect, useMemo, useCallback } from 'react';
import { getReports } from '../api/reports';
import type { Report } from '../../../shared/types';

export function useReports(statusFilter?: string, key?: number) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getReports(statusFilter)
      .then((d) => setReports(d.data ?? d))
      .catch(() => setError('Failed to load reports'))
      .finally(() => setLoading(false));
  }, [statusFilter, key]);

  const refetch = useCallback(() => {
    setLoading(true);
    getReports(statusFilter)
      .then((d) => setReports(d.data ?? d))
      .catch(() => setError('Failed to load reports'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const sorted = useMemo(
    () =>
      [...reports].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [reports],
  );

  return { reports: sorted, loading, error, refetch };
}
