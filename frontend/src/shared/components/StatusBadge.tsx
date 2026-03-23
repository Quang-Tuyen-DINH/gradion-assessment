import { Tag } from 'antd';
import type { ReportStatus } from '../types';

const colorMap: Record<ReportStatus, string> = {
  DRAFT: 'default',
  SUBMITTED: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
};

export function StatusBadge({ status }: { status: ReportStatus }) {
  return <Tag color={colorMap[status] ?? 'default'}>{status}</Tag>;
}
