import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

export default function DashboardPage() {
  const { user, isManager } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadDashboard() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/dashboard', { credentials: 'include' });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to load dashboard metrics');
      }
      setData(resData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  function getPriorityColor(priority) {
    switch (priority) {
      case 'URGENT': return { bg: '#fee2e2', text: '#991b1b' };
      case 'HIGH': return { bg: '#ffedd5', text: '#9a3412' };
      case 'MEDIUM': return { bg: '#fef3c7', text: '#92400e' };
      case 'LOW':
      default: return { bg: '#f1f5f9', text: '#475569' };
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
        Loading dashboard metrics from server...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#b91c1c',
        padding: '24px',
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Dashboard Error</h2>
        <p style={{ fontSize: '14px' }}>{error}</p>
        <button
          onClick={loadDashboard}
          style={{
            marginTop: '12px',
            background: '#2563eb',
            color: '#ffffff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { metrics, statusBreakdown, assigneeBreakdown, completionTrend, recentOverdue } = data;

  const statusColors = {
    BACKLOG: '#94a3b8',
    IN_PROGRESS: '#3b82f6',
    IN_REVIEW: '#8b5cf6',
    BLOCKED: '#ef4444',
    DONE: '#22c55e'
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
          Portfolio Dashboard
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
          Real-time server calculations across active projects and team workload.
        </p>
      </div>

      {/* 1. Headline Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Open Tasks */}
        <div style={{
          background: '#ffffff',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Open Tasks
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>
            {metrics.openTasks}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Tasks currently in progress or review
          </div>
        </div>

        {/* Overdue Tasks */}
        <div style={{
          background: '#ffffff',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Overdue Tasks
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#dc2626', marginTop: '8px' }}>
            {metrics.overdueTasks}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Past due date and unfinished
          </div>
        </div>

        {/* Due This Week */}
        <div style={{
          background: '#ffffff',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Due This Week
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>
            {metrics.dueThisWeek}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Upcoming deadlines in 7 days
          </div>
        </div>

        {/* Completed This Week */}
        <div style={{
          background: '#ffffff',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Completed This Week
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#16a34a', marginTop: '8px' }}>
            {metrics.completedThisWeek}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Marked DONE in past 7 days
          </div>
        </div>
      </div>

      {/* 2. Charts Row: 8-Week Trend & Status Distribution */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {/* 8-Week Completion Chart */}
        <div style={{
          background: '#ffffff',
          padding: '22px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              8-Week Completion Trend
            </h2>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Weekly throughput</span>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={completionTrend} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} />
                <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  labelStyle={{ fontWeight: 700, color: '#0f172a' }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  name="Tasks Completed"
                  stroke="#16a34a"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCompleted)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tasks by Status Chart */}
        <div style={{
          background: '#ffffff',
          padding: '22px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              Tasks by Lifecycle Status
            </h2>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Current stage distribution</span>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={statusBreakdown} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="status" stroke="#94a3b8" fontSize={11} />
                <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  labelStyle={{ fontWeight: 700, color: '#0f172a' }}
                />
                <Bar dataKey="count" name="Task Count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Assignee Workload Section */}
      <div style={{
        background: '#ffffff',
        padding: '22px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              Team Workload by Assignee
            </h2>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Active load and task distribution across project members.
            </p>
          </div>
        </div>

        {assigneeBreakdown.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
            No assigned members found in active projects.
          </p>
        ) : (
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={assigneeBreakdown} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  labelStyle={{ fontWeight: 700, color: '#0f172a' }}
                />
                <Legend />
                <Bar dataKey="openTasks" name="Open Tasks" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalTasks" name="Total Tasks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 4. Critical Overdue Tasks Quick View */}
      {recentOverdue.length > 0 && (
        <div style={{
          background: '#ffffff',
          padding: '22px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#dc2626' }}>
              ⚠️ Critical Overdue Tasks ({recentOverdue.length})
            </h2>
            <Link to="/alerts" style={{ fontSize: '13px', color: '#2563eb', fontWeight: 600 }}>
              View All Alerts →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentOverdue.map((t) => {
              const pColor = getPriorityColor(t.priority);
              return (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: '#fef2f2',
                    borderRadius: '8px',
                    border: '1px solid #fecaca'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      background: '#ffffff',
                      color: '#991b1b',
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
                      style={{ fontWeight: 600, fontSize: '13px', color: '#991b1b', textDecoration: 'none' }}
                    >
                      {t.title}
                    </Link>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: pColor.bg,
                      color: pColor.text
                    }}>
                      {t.priority}
                    </span>
                    <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>
                      Due: {new Date(t.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
