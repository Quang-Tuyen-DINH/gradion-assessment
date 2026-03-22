import client from '../../../shared/api/client';

interface AuthResponse {
  accessToken: string;
}

interface SignupResponse {
  id: string;
  email: string;
  role: string;
}

export const signup = (email: string, password: string): Promise<SignupResponse> =>
  client.post<SignupResponse>('/auth/signup', { email, password }).then(r => r.data);

export const login = (email: string, password: string): Promise<AuthResponse> =>
  client.post<AuthResponse>('/auth/login', { email, password }).then(r => r.data);
