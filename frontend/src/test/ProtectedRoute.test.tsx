import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../shared/components/ProtectedRoute';

function setup(hasToken: boolean) {
  if (hasToken) {
    localStorage.setItem('token', 'fake.token.here');
  } else {
    localStorage.removeItem('token');
  }
}

describe('ProtectedRoute', () => {
  afterEach(() => localStorage.clear());

  it('redirects to /login when no token is present', () => {
    setup(false);
    render(
      <MemoryRouter initialEntries={['/reports']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/reports"
            element={<ProtectedRoute><div>Protected Content</div></ProtectedRoute>}
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when token is present', () => {
    setup(true);
    render(
      <MemoryRouter initialEntries={['/reports']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/reports"
            element={<ProtectedRoute><div>Protected Content</div></ProtectedRoute>}
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
});
