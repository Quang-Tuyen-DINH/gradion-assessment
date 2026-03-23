import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppLayout } from '../shared/components/AppLayout';

function makeToken(role: 'user' | 'admin') {
  const payload = btoa(JSON.stringify({ sub: '1', email: 'test@test.com', role }));
  return `header.${payload}.sig`;
}

describe('AppLayout navigation', () => {
  afterEach(() => localStorage.clear());

  it('shows a single Reports nav item for a regular user', () => {
    localStorage.setItem('token', makeToken('user'));
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>,
    );
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('shows a single Reports nav item for an admin — no separate admin link', () => {
    localStorage.setItem('token', makeToken('admin'));
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>,
    );
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });
});
