import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export default function AppLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: '#1e293b', color: '#fff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 'bold', fontSize: '18px' }}>
          <Link to="/" style={{ color: '#fff' }}>BUSY Task Manager</Link>
        </div>
        <nav style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link to="/" style={{ color: '#94a3b8' }}>Dashboard</Link>
          <Link to="/login" style={{ color: '#94a3b8' }}>Sign In</Link>
        </nav>
      </header>
      <main style={{ flex: 1, padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <Outlet />
      </main>
    </div>
  );
}
