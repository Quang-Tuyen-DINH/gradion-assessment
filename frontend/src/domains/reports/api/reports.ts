import client from '../../../shared/api/client';

export const getReports = (status?: string) =>
  client.get('/reports', { params: status ? { status } : {} }).then(r => r.data);
export const getReport = (id: string) => client.get(`/reports/${id}`).then(r => r.data);
export const createReport = (title: string, description?: string) =>
  client.post('/reports', { title, description }).then(r => r.data);
export const updateReport = (id: string, data: { title?: string; description?: string }) =>
  client.patch(`/reports/${id}`, data).then(r => r.data);
export const deleteReport = (id: string) => client.delete(`/reports/${id}`);
export const submitReport = (id: string) => client.post(`/reports/${id}/submit`).then(r => r.data);
export const returnToDraft = (id: string) => client.post(`/reports/${id}/return-to-draft`).then(r => r.data);
