import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '../shared/components/ErrorBoundary';
import { ProtectedRoute } from '../shared/components/ProtectedRoute';
import { AppLayout } from '../shared/components/AppLayout';
import { LoginPage } from '../domains/auth/pages/LoginPage';
import { SignupPage } from '../domains/auth/pages/SignupPage';
import { ReportsPage } from '../domains/reports/pages/ReportsPage';
import { ReportDetailPage } from '../domains/reports/pages/ReportDetailPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<ErrorBoundary><LoginPage /></ErrorBoundary>} />
        <Route path="/signup" element={<ErrorBoundary><SignupPage /></ErrorBoundary>} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/reports" element={<ErrorBoundary><ReportsPage /></ErrorBoundary>} />
          <Route path="/reports/:id" element={<ErrorBoundary><ReportDetailPage /></ErrorBoundary>} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
