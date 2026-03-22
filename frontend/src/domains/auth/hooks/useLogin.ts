import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';

export function useLogin() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (email: string, password: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await login(email, password);
      localStorage.setItem('token', data.accessToken);
      navigate('/reports');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };
  return { submit, error, loading };
}
