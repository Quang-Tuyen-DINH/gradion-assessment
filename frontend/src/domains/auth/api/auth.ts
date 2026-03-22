import client from '../../../shared/api/client';
export const signup = (email: string, password: string) =>
  client.post('/auth/signup', { email, password }).then(r => r.data);
export const login = (email: string, password: string) =>
  client.post('/auth/login', { email, password }).then(r => r.data);
