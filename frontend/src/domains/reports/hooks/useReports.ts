import { useState, useEffect, useMemo, useCallback } from 'react';
import { getReports } from '../api/reports';
import type { ReportStatus, ExpenseCategory } from '../../../shared/types';

interface ReportItem {
  id: string;
  amount: number | string;
  category: ExpenseCategory;
  merchantName?: string;
  date: string;
}

interface Report {
  id: string;
  title: string;
  description?: string;
  status: ReportStatus;
  totalAmount: number | string;
  createdAt: string;
  items?: ReportItem[];
}

export function useReports(statusFilter?: string) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getReports(statusFilter)
      .then((d) => setReports(d.data ?? d))
      .catch(() => setError('Failed to load reports'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

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
