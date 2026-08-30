import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MyTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  async function loadMyTasks() {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/tasks?assignee=${user.id}&limit=100`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load your tasks');
      }
      setTasks(data.data || data.tasks || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMyTasks();
  }, [user]);

  async function handleQuickStatus(taskId, newStatus) {
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Status transition failed');
        return;
      }
      await loadMyTasks();
    } catch (err) {
      alert(err.message);
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

  function getStatusColor(status) {
    switch (status) {
      case 'DONE': return { bg: '#dcfce7', text: '#166534' };
      case 'IN_PROGRESS': return { bg: '#dbeafe', text: '#1e40af' };
      case 'IN_REVIEW': return { bg: '#f3e8ff', text: '#6b21a8' };
      case 'BLOCKED': return { bg: '#fee2e2', text: '#991b1b' };
      case 'BACKLOG':
      default: return { bg: '#f1f5f9', text: '#475569' };
    }
  }

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'OPEN') return t.status !== 'DONE';
    return t.status === statusFilter;
  });

  const statuses = ['ALL', 'OPEN', 'IN_PROGRESS', 'IN_REVIEW', 'BACKLOG', 'BLOCKED', 'DONE'];

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
          My Assigned Tasks
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
          Overview of all tasks specifically assigned to you across active projects.
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {statuses.map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: statusFilter === st ? '1px solid #2563eb' : '1px solid #e2e8f0',
              background: statusFilter === st ? '#2563eb' : '#ffffff',
              color: statusFilter === st ? '#ffffff' : '#475569',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            {st === 'ALL' ? `All (${tasks.length})` : st === 'OPEN' ? `Open (${tasks.filter(t => t.status !== 'DONE').length})` : st}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Task List Table */}
      <div style={{
        background: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
      }}>
        {loading ? (
          <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>
            Loading your tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div style={{ padding: '50px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#475569' }}>
              No tasks found for this filter.
            </p>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
              You have no tasks matching the selected criteria.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Task
                </th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Project
                </th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Status
                </th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Priority
                </th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Due Date
                </th>
                <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((t) => {
                const pColor = getPriorityColor(t.priority);
                const sColor = getStatusColor(t.status);
                const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE';

                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <Link
                        to={`/tasks/${t.id}`}
                        style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px', textDecoration: 'none' }}
                        onMouseOver={(e) => (e.currentTarget.style.color = '#2563eb')}
                        onMouseOut={(e) => (e.currentTarget.style.color = '#1e293b')}
                      >
                        {t.title}
                      </Link>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
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
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        background: sColor.bg,
                        color: sColor.text,
                        letterSpacing: '0.05em'
                      }}>
                        {t.status}
                      </span>
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

                    <td style={{ padding: '14px 16px', fontSize: '13px', color: isOverdue ? '#dc2626' : '#64748b', fontWeight: isOverdue ? 700 : 500 }}>
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}
                      {isOverdue && ' (Overdue)'}
                    </td>

                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        {t.legalNextStatuses && t.legalNextStatuses.map((nextSt) => (
                          <button
                            key={nextSt}
                            onClick={() => handleQuickStatus(t.id, nextSt)}
                            style={{
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              background: nextSt === 'DONE' ? '#dcfce7' : '#eff6ff',
                              color: nextSt === 'DONE' ? '#166534' : '#1d4ed8'
                            }}
                          >
                            → {nextSt}
                          </button>
                        ))}
                        <Link
                          to={`/tasks/${t.id}`}
                          style={{
                            fontSize: '12px',
                            color: '#64748b',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: '#f1f5f9',
                            fontWeight: 500
                          }}
                        >
                          View
                        </Link>
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
