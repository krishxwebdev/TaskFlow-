import { useState } from 'react';
import { login, register } from '../api/api';

// This component now handles TWO modes in one form: "login" and "register".
// `mode` state decides which fields show and which API function gets called.
function Login({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = mode === 'login'
        ? await login(employeeId, password)
        : await register(username, employeeId, password);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>TaskFlow</h1>
        <p className="subtitle">
          {mode === 'login' ? 'Sign in to manage your tasks' : 'Create your account'}
        </p>

        {mode === 'register' && (
          <>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Priya Sharma"
              required
              autoComplete="name"
            />
          </>
        )}

        <label htmlFor="employeeId">Employee ID</label>
        <input
          id="employeeId"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          placeholder="e.g. EMP1024"
          required
          autoComplete="username"
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          minLength={6}
          required
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />

        {error && <p className="error-text">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <p className="hint">
          {mode === 'login' ? "Don't have an account? " : 'Already registered? '}
          <button type="button" className="link-button" onClick={switchMode}>
            {mode === 'login' ? 'Register' : 'Sign in'}
          </button>
        </p>
      </form>
    </div>
  );
}

export default Login;
