import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../shared/components/StatusBadge';
import type { ReportStatus } from '../shared/types';

describe('StatusBadge', () => {
  const statuses: ReportStatus[] = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'];

  statuses.forEach((status) => {
    it(`renders label for ${status}`, () => {
      render(<StatusBadge status={status} />);
      expect(screen.getByText(status)).toBeInTheDocument();
    });
  });
});
