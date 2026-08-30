import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function UsersPage() {
  const { user, isManager } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadUsers() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/users', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load user directory');
      }
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function getInitials(name) {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  }

  if (!isManager) {
    return (
      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '24px', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Access Denied</h2>
        <p style={{ fontSize: '14px', marginTop: '6px' }}>
          Only managers have access to the user directory and account administration.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
          Team & User Directory
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
          Manage user accounts, system roles, and workforce access.
        </p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Users Table */}
      <div style={{
        background: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
      }}>
        {loading ? (
          <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>
            Loading users directory...
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '50px 24px', textAlign: 'center', color: '#64748b' }}>
            No users registered in the system.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  User
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Email Address
                </th>
                <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  System Role
                </th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Registered
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: u.role === 'MANAGER' ? '#2563eb' : '#64748b',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '12px'
                      }}>
                        {getInitials(u.name)}
                      </div>
                      <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px' }}>
                        {u.name} {u.id === user?.id && <span style={{ color: '#2563eb', fontSize: '12px' }}>(You)</span>}
                      </span>
                    </div>
                  </td>

                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569' }}>
                    {u.email}
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: u.role === 'MANAGER' ? '#dbeafe' : '#f1f5f9',
                      color: u.role === 'MANAGER' ? '#1e40af' : '#475569',
                      letterSpacing: '0.05em'
                    }}>
                      {u.role}
                    </span>
                  </td>

                  <td style={{ padding: '14px 20px', fontSize: '13px', color: '#64748b' }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
