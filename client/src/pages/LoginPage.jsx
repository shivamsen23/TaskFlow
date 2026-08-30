import React from 'react';

export default function LoginPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
      <div style={{ background: '#fff', padding: '32px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Sign In</h1>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>Welcome back. Sign in to access your projects and tasks.</p>
        <form onSubmit={(e) => e.preventDefault()}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>Email</label>
            <input
              type="email"
              placeholder="user@example.com"
              disabled
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              disabled
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
            />
          </div>
          <button
            type="submit"
            disabled
            style={{ width: '100%', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'not-allowed', opacity: 0.7 }}
          >
            Sign In (Placeholder)
          </button>
        </form>
      </div>
    </div>
  );
}
