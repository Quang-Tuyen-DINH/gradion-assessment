import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '../shared/components/ErrorBoundary';
import { ProtectedRoute } from '../shared/components/ProtectedRoute';
import { LoginPage } from '../domains/auth/pages/LoginPage';
import { SignupPage } from '../domains/auth/pages/SignupPage';
import { ReportsPage } from '../domains/reports/pages/ReportsPage';
import { ReportDetailPage } from '../domains/reports/pages/ReportDetailPage';
import { AdminReportsPage } from '../domains/admin/pages/AdminReportsPage';
import { AdminReportDetailPage } from '../domains/admin/pages/AdminReportDetailPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <ErrorBoundary>
              <LoginPage />
            </ErrorBoundary>
          }
        />
        <Route
          path="/signup"
          element={
            <ErrorBoundary>
              <SignupPage />
            </ErrorBoundary>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <ReportsPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/:id"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <ReportDetailPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <AdminReportsPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports/:id"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <AdminReportDetailPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
