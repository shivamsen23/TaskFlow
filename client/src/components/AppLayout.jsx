import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AppLayout() {
  const { user, isManager, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetch('/api/alerts', { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => setAlertCount(data.activeCount || 0))
        .catch(() => setAlertCount(0));
    }
  }, [user, location.pathname]);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  function getInitials(name) {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  const navItems = [
    { to: '/', label: 'Dashboard', icon: '📊' },
    { to: '/projects', label: 'Projects', icon: '📁' },
    { to: '/tasks', label: 'Tasks', icon: '📋' },
    { to: '/my-tasks', label: 'My Tasks', icon: '👤' },
    { to: '/alerts', label: 'Alerts', icon: '⚠️', badge: alertCount },
    { to: '/reports', label: 'Reports', icon: '📈' },
    ...(isManager ? [{ to: '/users', label: 'Users', icon: '👥' }] : [])
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Dark Navy Sidebar */}
      <aside style={{
        width: '240px',
        background: '#0f172a',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        borderRight: '1px solid #1e293b',
        zIndex: 40,
        flexShrink: 0
      }}>
        {/* Brand Header */}
        <div style={{
          padding: '24px 20px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          borderBottom: '1px solid #1e293b'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '16px',
            color: '#ffffff',
            boxShadow: '0 2px 4px rgba(37,99,235,0.4)'
          }}>
            B
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '15px', color: '#ffffff', letterSpacing: '-0.02em' }}>
              BUSY Tasks
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
              Workforce Portfolio
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', padding: '6px 12px 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Menu
          </div>
          {navItems.map((item) => {
            const isActive =
              item.to === '/'
                ? location.pathname === '/' || location.pathname === '/dashboard'
                : location.pathname.startsWith(item.to);

            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#ffffff' : '#94a3b8',
                  background: isActive ? '#1e293b' : 'transparent',
                  transition: 'background-color 0.15s, color 0.15s'
                }}
                onMouseOver={(e) => {
                  if (!isActive) e.currentTarget.style.background = '#1e293b80';
                }}
                onMouseOut={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '15px' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span style={{
                    background: '#dc2626',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '9999px',
                    boxShadow: '0 1px 2px rgba(220,38,38,0.4)'
                  }}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Footer Card */}
        {user && (
          <div style={{
            padding: '16px',
            borderTop: '1px solid #1e293b',
            background: '#090d16'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: user.role === 'MANAGER' ? '#2563eb' : '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '13px',
                color: '#ffffff',
                flexShrink: 0
              }}>
                {getInitials(user.name)}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#f8fafc',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {user.name}
                </div>
                <span style={{
                  display: 'inline-block',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  background: user.role === 'MANAGER' ? '#1e40af' : '#334155',
                  color: user.role === 'MANAGER' ? '#93c5fd' : '#cbd5e1',
                  letterSpacing: '0.04em'
                }}>
                  {user.role}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#cbd5e1',
                padding: '7px 0',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center'
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#334155')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#1e293b')}
            >
              Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        <main style={{ flex: 1, padding: '32px 36px', maxWidth: '1280px', width: '100%', margin: '0 auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
