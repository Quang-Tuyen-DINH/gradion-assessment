import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../api/auth';

export function useSignup() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (email: string, password: string) => {
    setLoading(true);
    setError('');
    try {
      await signup(email, password);
      navigate('/login');
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 409) {
        setError('Email already in use');
      } else {
        setError('Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  return { submit, error, loading };
}
