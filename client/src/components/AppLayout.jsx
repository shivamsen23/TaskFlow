import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <header style={{
        background: '#0f172a',
        color: '#fff',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link to="/" style={{ fontWeight: 700, fontSize: '18px', color: '#f8fafc', letterSpacing: '-0.025em' }}>
            BUSY Task Manager
          </Link>
          <nav style={{ display: 'flex', gap: '16px' }}>
            <Link to="/" style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 500 }}>
              Dashboard
            </Link>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#e2e8f0' }}>
                  {user.name}
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: user.role === 'MANAGER' ? '#3b82f6' : '#64748b',
                  color: '#ffffff'
                }}>
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: '1px solid #334155',
                  color: '#cbd5e1',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#1e293b')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              style={{
                background: '#2563eb',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: 500
              }}
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      <main style={{ flex: 1, padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <Outlet />
      </main>
    </div>
  );
}
