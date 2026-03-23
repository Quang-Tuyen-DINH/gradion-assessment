import client from '../../../shared/api/client';
export const getAdminReports = (status?: string) =>
  client.get('/admin/reports', { params: status ? { status } : {} }).then((r) => r.data);
export const getAdminReport = (id: string) =>
  client.get(`/admin/reports/${id}`).then((r) => r.data);
export const approveReport = (id: string) =>
  client.post(`/admin/reports/${id}/approve`).then((r) => r.data);
export const rejectReport = (id: string) =>
  client.post(`/admin/reports/${id}/reject`).then((r) => r.data);
