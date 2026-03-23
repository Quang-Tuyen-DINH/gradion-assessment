import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ReportsPage } from '../domains/reports/pages/ReportsPage';

function makeToken(role: 'user' | 'admin') {
  const payload = btoa(JSON.stringify({ sub: '1', email: 'test@test.com', role }));
  return `header.${payload}.sig`;
}

vi.mock('../domains/reports/api/reports', () => ({
  createReport: vi.fn(),
  deleteReport: vi.fn(),
}));
vi.mock('../domains/reports/hooks/useReports', () => ({
  useReports: () => ({ reports: [], loading: false, error: null, refetch: vi.fn() }),
}));
vi.mock('../domains/admin/api/admin', () => ({
  getAdminReports: vi.fn().mockResolvedValue({ data: [] }),
}));

describe('ReportsPage role-aware rendering', () => {
  afterEach(() => localStorage.clear());

  it('shows "My Reports" heading and New Report button for user role', () => {
    localStorage.setItem('token', makeToken('user'));
    render(<MemoryRouter><ReportsPage /></MemoryRouter>);
    expect(screen.getByText('My Reports')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new report/i })).toBeInTheDocument();
  });

  it('shows "All Reports" heading and User column for admin role', () => {
    localStorage.setItem('token', makeToken('admin'));
    render(<MemoryRouter><ReportsPage /></MemoryRouter>);
    expect(screen.getByText('All Reports')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /new report/i })).not.toBeInTheDocument();
  });
});
