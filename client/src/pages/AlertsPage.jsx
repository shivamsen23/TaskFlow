import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AlertsPage() {
  const { user, isManager } = useAuth();

  const [alerts, setAlerts] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterMode, setFilterMode] = useState('active'); // 'active' or 'all'
  const [dismissingId, setDismissingId] = useState(null);

  async function loadAlerts() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/alerts', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load alerts');
      }
      setAlerts(data.alerts || []);
      setActiveCount(data.activeCount || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  async function handleDismissAlert(taskId) {
    setDismissingId(taskId);
    try {
      const res = await fetch(`/api/alerts/${taskId}/dismiss`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dismiss alert');
      }
      await loadAlerts();
    } catch (err) {
      alert(err.message);
    } finally {
      setDismissingId(null);
    }
  }

  function getPriorityColor(priority) {
    switch (priority) {
      case 'URGENT': return { bg: '#fee2e2', text: '#991b1b' };
      case 'HIGH': return { bg: '#ffedd5', text: '#9a3412' };
      case 'MEDIUM': return { bg: '#fef3c7', text: '#92400e' };
      case 'LOW':
      default: return { bg: '#f1f5f9', text: '#475569' };
    }
  }

  const displayedAlerts = alerts.filter((a) => {
    if (filterMode === 'active') return !a.isDismissed;
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
              Overdue Alerts
            </h1>
            {activeCount > 0 && (
              <span style={{
                background: '#dc2626',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px'
              }}>
                {activeCount} Active
              </span>
            )}
          </div>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
            Tasks past their due date that require immediate attention.
          </p>
        </div>

        {/* Filter Toggle */}
        <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '8px', padding: '3px' }}>
          <button
            onClick={() => setFilterMode('active')}
            style={{
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              background: filterMode === 'active' ? '#ffffff' : 'transparent',
              color: filterMode === 'active' ? '#0f172a' : '#64748b',
              boxShadow: filterMode === 'active' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            Active Alerts ({activeCount})
          </button>
          <button
            onClick={() => setFilterMode('all')}
            style={{
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              background: filterMode === 'all' ? '#ffffff' : 'transparent',
              color: filterMode === 'all' ? '#0f172a' : '#64748b',
              boxShadow: filterMode === 'all' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            All Overdue ({alerts.length})
          </button>
        </div>
      </div>

      {/* Info Notice */}
      <div style={{
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        padding: '12px 18px',
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '13px',
        color: '#1e40af',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>💡</span>
        <span>
          <strong>Alert Invalidation:</strong> A person can dismiss an overdue alert for a task assigned to them. If that task's due date is later modified, the alert will automatically resurface.
        </span>
      </div>

      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#b91c1c',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {/* Alerts Table */}
      <div style={{
        background: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
      }}>
        {loading ? (
          <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>
            Checking overdue alerts...
          </div>
        ) : displayedAlerts.length === 0 ? (
          <div style={{ padding: '50px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: '18px', fontWeight: 700, color: '#16a34a' }}>
              ✓ No active overdue alerts
            </p>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
              All tasks in visible projects are on schedule or completed.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Overdue Task
                </th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Priority
                </th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Due Date
                </th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Days Overdue
                </th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Assignees
                </th>
                <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedAlerts.map((t) => {
                const pColor = getPriorityColor(t.priority);
                const canDismiss = t.isAssignedToUser || isManager;

                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9', background: t.isDismissed ? '#fafafa' : '#ffffff' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          background: '#f1f5f9',
                          color: '#475569',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          fontFamily: 'monospace'
                        }}>
                          {t.project?.key}
                        </span>
                        <Link
                          to={`/tasks/${t.id}`}
                          style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px', textDecoration: 'none' }}
                          onMouseOver={(e) => (e.currentTarget.style.color = '#2563eb')}
                          onMouseOut={(e) => (e.currentTarget.style.color = '#1e293b')}
                        >
                          {t.title}
                        </Link>
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        background: pColor.bg,
                        color: pColor.text,
                        letterSpacing: '0.05em'
                      }}>
                        {t.priority}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#dc2626', fontWeight: 600 }}>
                      {new Date(t.dueDate).toLocaleDateString()}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        background: '#fee2e2',
                        color: '#991b1b',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 700
                      }}>
                        {t.daysOverdue} {t.daysOverdue === 1 ? 'day' : 'days'} overdue
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      {t.assignees && t.assignees.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {t.assignees.map((a) => (
                            <span
                              key={a.userId}
                              style={{
                                background: a.userId === user?.id ? '#eff6ff' : '#f1f5f9',
                                color: a.userId === user?.id ? '#1e40af' : '#475569',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: a.userId === user?.id ? 700 : 500
                              }}
                            >
                              {a.user.name} {a.userId === user?.id ? '(You)' : ''}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>

                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                        <Link
                          to={`/tasks/${t.id}`}
                          style={{
                            fontSize: '13px',
                            color: '#2563eb',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: '#eff6ff'
                          }}
                        >
                          View Task
                        </Link>

                        {t.isDismissed ? (
                          <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600, padding: '4px 8px' }}>
                            ✓ Dismissed
                          </span>
                        ) : canDismiss ? (
                          <button
                            onClick={() => handleDismissAlert(t.id)}
                            disabled={dismissingId === t.id}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              color: '#475569',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: dismissingId === t.id ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {dismissingId === t.id ? 'Dismissing...' : 'Dismiss'}
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                            Not Assigned
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
