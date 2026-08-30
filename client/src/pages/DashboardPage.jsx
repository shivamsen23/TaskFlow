import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [managerCheckResult, setManagerCheckResult] = useState(null);
  const [loadingCheck, setLoadingCheck] = useState(false);

  async function testManagerAccess() {
    setLoadingCheck(true);
    setManagerCheckResult(null);
    try {
      const res = await fetch('/api/auth/manager-only-test', {
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setManagerCheckResult({ success: true, message: data.message });
      } else {
        setManagerCheckResult({ success: false, message: data.error || 'Access denied' });
      }
    } catch (err) {
      setManagerCheckResult({ success: false, message: 'Network error checking access' });
    } finally {
      setLoadingCheck(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
          Welcome back, {user?.name}!
        </h1>
        <p style={{ color: '#64748b', fontSize: '15px', marginTop: '4px' }}>
          Signed in as <strong>{user?.email}</strong> ({user?.role})
        </p>
      </div>

      <div style={{
        background: '#ffffff',
        padding: '24px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        marginBottom: '24px'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>
          Authentication & Role Verification
        </h2>
        <p style={{ color: '#475569', fontSize: '14px', marginBottom: '16px', lineHeight: 1.6 }}>
          Role-based authorization is enforced strictly on the server. Click below to test the server's manager-only authorization gate:
        </p>

        <button
          onClick={testManagerAccess}
          disabled={loadingCheck}
          style={{
            background: '#0f172a',
            color: '#ffffff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: loadingCheck ? 'not-allowed' : 'pointer'
          }}
        >
          {loadingCheck ? 'Testing...' : 'Test Manager-Only Endpoint (GET /api/auth/manager-only-test)'}
        </button>

        {managerCheckResult && (
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            background: managerCheckResult.success ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${managerCheckResult.success ? '#a7f3d0' : '#fecaca'}`,
            color: managerCheckResult.success ? '#065f46' : '#991b1b'
          }}>
            <strong>{managerCheckResult.success ? '200 OK — Allowed: ' : '403 Forbidden — Blocked: '}</strong>
            {managerCheckResult.message}
          </div>
        )}
      </div>
    </div>
  );
}
