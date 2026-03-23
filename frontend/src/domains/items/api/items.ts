import client from '../../../shared/api/client';

export interface CreateItemPayload {
  amount: number;
  currency?: string;
  category?: string;
  merchantName?: string;
  transactionDate?: string;
}

export const createItem = (reportId: string, data: CreateItemPayload) =>
  client.post(`/reports/${reportId}/items`, data).then((r) => r.data);
export const updateItem = (reportId: string, itemId: string, data: Partial<CreateItemPayload>) =>
  client.patch(`/reports/${reportId}/items/${itemId}`, data).then((r) => r.data);
export const deleteItem = (reportId: string, itemId: string) =>
  client.delete(`/reports/${reportId}/items/${itemId}`);
