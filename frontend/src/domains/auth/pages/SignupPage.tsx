import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSignup } from '../hooks/useSignup';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';

export function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { submit, error, loading } = useSignup();

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
      <h2>Sign Up</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading && <LoadingSpinner />}
      <input
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: 'block', width: '100%', marginBottom: 8 }}
      />
      <input
        placeholder="Password (min 8 characters)"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: 'block', width: '100%', marginBottom: 8 }}
      />
      <button onClick={() => submit(email, password)} disabled={loading}>
        Sign Up
      </button>
      <p>
        <Link to="/login">Already have an account? Login</Link>
      </p>
    </div>
  );
}
