import type { ReportStatus } from '../types';
const colors: Record<ReportStatus, string> = {
  DRAFT: '#9ca3af',
  SUBMITTED: '#3b82f6',
  APPROVED: '#22c55e',
  REJECTED: '#ef4444',
};
export function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span
      style={{
        background: colors[status] ?? '#9ca3af',
        padding: '2px 8px',
        borderRadius: 4,
        color: '#fff',
        fontSize: 12,
      }}
    >
      {status}
    </span>
  );
}
