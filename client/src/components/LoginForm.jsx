import { useState } from 'react';
import { api } from '../services/api';

export default function LoginForm({ onAuthenticated }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const body = mode === 'login' ? { username, password } : { username, displayName, password };
      const { data } = await api.post(endpoint, body);
      onAuthenticated({ token: data.token, sessionId: data.sessionId, displayName: data.user.displayName || data.user.display_name });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required />
      {mode === 'signup' && (
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name" required />
      )}
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit">{mode === 'login' ? 'Log in' : 'Sign up'}</button>
      <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
        {mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Log in'}
      </button>
    </form>
  );
}