import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect to intended page or home
  if (user) {
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleQuickFill(demoEmail, demoPassword) {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  }

  const demoUsers = [
    { name: 'Shivam Sen', email: 'shivam.sen@busyinfotech.com', role: 'MANAGER', note: 'All Projects' },
    { name: 'Elena Rostova', email: 'elena.rostova@busyinfotech.com', role: 'MEMBER', note: 'Apollo & Titan' },
    { name: 'Arjun Mehta', email: 'arjun.mehta@busyinfotech.com', role: 'MEMBER', note: 'Nexus' }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    }}>
      <div style={{
        background: '#ffffff',
        width: '100%',
        maxWidth: '440px',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ marginBottom: '28px', textAlign: 'center' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            fontWeight: 800,
            margin: '0 auto 12px',
            boxShadow: '0 4px 6px rgba(37,99,235,0.3)'
          }}>
            T
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
            TaskFlow
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            Project & Task Management
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '12px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '20px',
            lineHeight: 1.4
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@busyinfotech.com"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                background: '#f8fafc'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                background: '#f8fafc'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '11px',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
              boxShadow: '0 2px 4px rgba(37,99,235,0.3)'
            }}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '28px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            Quick Demo Logins (Password123!)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {demoUsers.map((u) => (
              <button
                key={u.email}
                type="button"
                onClick={() => handleQuickFill(u.email, 'Password123!')}
                style={{
                  textAlign: 'left',
                  padding: '9px 12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#eff6ff')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#f8fafc')}
              >
                <div>
                  <strong style={{ color: '#0f172a' }}>{u.name}</strong> <span style={{ color: '#64748b' }}>({u.note})</span>
                </div>
                <span style={{
                  fontSize: '10px',
                  background: u.role === 'MANAGER' ? '#dbeafe' : '#f1f5f9',
                  color: u.role === 'MANAGER' ? '#1e40af' : '#475569',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: 700
                }}>
                  {u.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
