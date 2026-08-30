import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from 'recharts';

export default function ReportsPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadReportData() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/dashboard', { credentials: 'include' });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to load report metrics');
      }
      setData(resData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReportData();
  }, []);

  function handleExportAll() {
    window.location.href = '/api/tasks/export/csv';
  }

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
        Generating portfolio analytics from PostgreSQL database...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '24px', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Report Error</h2>
        <p style={{ fontSize: '14px', marginTop: '6px' }}>{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { metrics, statusBreakdown, assigneeBreakdown, completionTrend } = data;
  const totalTasksCount = statusBreakdown.reduce((sum, s) => sum + s.count, 0);
  const completedCount = statusBreakdown.find((s) => s.status === 'DONE')?.count || 0;
  const completionRate = totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
            Portfolio Analytics & Reports
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
            Server-aggregated delivery metrics, velocity trends, and resource allocations.
          </p>
        </div>

        <button
          onClick={handleExportAll}
          style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            color: '#1e293b',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          📥 Export Complete CSV Dataset
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overall Completion Rate</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#16a34a', marginTop: '8px' }}>{completionRate}%</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{completedCount} of {totalTasksCount} tasks completed</div>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Workload</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#2563eb', marginTop: '8px' }}>{metrics.openTasks}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Tasks currently in development</div>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overdue Ratio</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#dc2626', marginTop: '8px' }}>
            {metrics.openTasks > 0 ? Math.round((metrics.overdueTasks / metrics.openTasks) * 100) : 0}%
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{metrics.overdueTasks} past due tasks</div>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>7-Day Throughput</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>{metrics.completedThisWeek}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Tasks marked DONE this week</div>
        </div>
      </div>

      {/* Visual Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Weekly Throughput Area Chart */}
        <div style={{ background: '#ffffff', padding: '22px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
            Weekly Delivery Velocity (8 Weeks)
          </h2>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={completionTrend} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReport" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} />
                <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                <Area type="monotone" dataKey="completed" name="Delivered Tasks" stroke="#2563eb" strokeWidth={2} fill="url(#colorReport)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div style={{ background: '#ffffff', padding: '22px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
            Pipeline Distribution
          </h2>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={statusBreakdown} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="status" stroke="#94a3b8" fontSize={11} />
                <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                <Bar dataKey="count" name="Tasks" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Resource Utilization Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
            Resource Utilization & Capacity Breakdown
          </h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Team Member</th>
              <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Role</th>
              <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Open Tasks</th>
              <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Total Assigned</th>
              <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Completed Ratio</th>
            </tr>
          </thead>
          <tbody>
            {assigneeBreakdown.map((a) => {
              const closed = a.totalTasks - a.openTasks;
              const ratio = a.totalTasks > 0 ? Math.round((closed / a.totalTasks) * 100) : 0;
              return (
                <tr key={a.userId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: '#1e293b', fontSize: '14px' }}>
                    {a.name} <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 400 }}>({a.email})</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: a.role === 'MANAGER' ? '#dbeafe' : '#f1f5f9',
                      color: a.role === 'MANAGER' ? '#1e40af' : '#475569'
                    }}>
                      {a.role}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 700, color: a.openTasks > 3 ? '#d97706' : '#1e293b' }}>
                    {a.openTasks}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#475569' }}>
                    {a.totalTasks}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${ratio}%`, height: '100%', background: '#16a34a' }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a', minWidth: '35px' }}>{ratio}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
