import client from '../../../shared/api/client';

export const suggestCategory = (merchantName: string): Promise<{ category: string }> =>
  client.post('/ai/suggest-category', { merchantName }).then((r) => r.data);
