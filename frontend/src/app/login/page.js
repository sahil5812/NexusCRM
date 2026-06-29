'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('rajesh@crm.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serverStatus, setServerStatus] = useState('checking'); // 'checking', 'warming', 'ready'

  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';
    // Get the base root URL of the API server (e.g. strip "/api")
    const rootUrl = API_BASE.endsWith('/api') ? API_BASE.slice(0, -4) : API_BASE;

    const pingServer = async () => {
      try {
        const res = await fetch(`${rootUrl}/`, { method: 'GET' });
        if (res.ok) {
          setServerStatus('ready');
        } else {
          setServerStatus('warming');
        }
      } catch (err) {
        setServerStatus('warming');
        // Retry checking every 4 seconds
        setTimeout(pingServer, 4000);
      }
    };

    pingServer();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-layout-wrapper">
      <div className="mesh-gradient-bg"></div>

      <div className="login-card anim-slide-up">
        <div className="login-logo">
          Nexus<span className="logo-highlight">CRM</span>
        </div>
        <p className="login-subtitle">Autonomous Multi-Agent CRM System</p>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          {serverStatus === 'checking' && (
            <span className="badge badge-neutral anim-pulse" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
              checking cloud server status...
            </span>
          )}
          {serverStatus === 'warming' && (
            <span className="badge badge-warning anim-pulse" style={{ fontSize: '0.75rem', padding: '6px 12px', textAlign: 'center', textTransform: 'none' }}>
              Cloud server waking up... (takes ~50s)
            </span>
          )}
          {serverStatus === 'ready' && (
            <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
              ✓ Cloud server online
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{ color: 'var(--accent-rose)', fontSize: '0.85rem', marginBottom: '12px' }}>
              {error}
            </div>
          )}

          <div className="form-group" style={{ marginTop: '24px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In to Console'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <p>Demo: rajesh@crm.com / admin123</p>
          <p>Also: priya@crm.com / sales123 · amit@crm.com / support123</p>
        </div>
      </div>
    </div>
  );
}
