import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TaskModal from '../components/TaskModal';

export default function TasksPage() {
  const { user, isManager } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [assignedToMeOnly, setAssignedToMeOnly] = useState(false);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Load accessible projects for dropdown
  useEffect(() => {
    fetch('/api/projects', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setProjects(data.projects || []))
      .catch((err) => console.error('Failed to fetch projects:', err));
  }, []);

  // Load tasks
  async function loadTasks() {
    setLoading(true);
    setError('');
    try {
      let url = '/api/tasks?';
      if (selectedProjectId) {
        url += `projectId=${selectedProjectId}&`;
      }
      if (assignedToMeOnly) {
        url += 'assignedToMe=true&';
      }

      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch tasks');
      }

      let list = data.tasks || [];
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter((t) =>
          t.title.toLowerCase().includes(q) ||
          t.project?.key.toLowerCase().includes(q) ||
          t.project?.name.toLowerCase().includes(q)
        );
      }
      setTasks(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, [selectedProjectId, assignedToMeOnly, search]);

  async function handleSaveTask(payload, taskId) {
    const isEdit = !!taskId;
    const url = isEdit ? `/api/tasks/${taskId}` : '/api/tasks';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to save task');
    }

    await loadTasks();
  }

  async function handleDeleteTask(task) {
    if (!window.confirm(`Are you sure you want to delete task "${task.title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete task');
      }
      await loadTasks();
    } catch (err) {
      alert(err.message);
    }
  }

  function getPriorityColor(priority) {
    switch (priority) {
      case 'URGENT':
        return { bg: '#fee2e2', text: '#991b1b' };
      case 'HIGH':
        return { bg: '#ffedd5', text: '#9a3412' };
      case 'MEDIUM':
        return { bg: '#fef3c7', text: '#92400e' };
      case 'LOW':
        return { bg: '#f1f5f9', text: '#475569' };
      default:
        return { bg: '#f1f5f9', text: '#475569' };
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case 'DONE':
        return { bg: '#dcfce7', text: '#166534' };
      case 'IN_PROGRESS':
        return { bg: '#dbeafe', text: '#1e40af' };
      case 'IN_REVIEW':
        return { bg: '#f3e8ff', text: '#6b21a8' };
      case 'BLOCKED':
        return { bg: '#fee2e2', text: '#991b1b' };
      case 'BACKLOG':
      default:
        return { bg: '#f1f5f9', text: '#475569' };
    }
  }

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
            Tasks
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
            View and manage tasks across your active projects.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingTask(null);
            setIsModalOpen(true);
          }}
          style={{
            background: '#2563eb',
            color: '#ffffff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}
        >
          <span>+</span> New Task
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        background: '#ffffff',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks by title or project key..."
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>
              Project:
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '13px',
                background: '#ffffff',
                outline: 'none'
              }}
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.key}] {p.name}
                </option>
              ))}
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={assignedToMeOnly}
              onChange={(e) => setAssignedToMeOnly(e.target.checked)}
            />
            <span style={{ fontWeight: 500 }}>Assigned to Me</span>
          </label>
        </div>
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

      {/* Task List Table */}
      <div style={{
        background: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
      }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Loading tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#334155' }}>
              No tasks found
            </p>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
              {search || selectedProjectId || assignedToMeOnly
                ? 'Try adjusting your search filters.'
                : 'Create your first task using the "+ New Task" button.'}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Task Title & Project
                </th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Priority
                </th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Status
                </th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Due Date
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
              {tasks.map((t) => {
                const pColor = getPriorityColor(t.priority);
                const sColor = getStatusColor(t.status);
                const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE';

                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
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
                      {t.description && (
                        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', maxWidth: '380px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.description}
                        </p>
                      )}
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
                    <td style={{ padding: '14px 16px', fontSize: '13px' }}>
                      {t.dueDate ? (
                        <span style={{ color: isOverdue ? '#dc2626' : '#475569', fontWeight: isOverdue ? 600 : 400 }}>
                          {new Date(t.dueDate).toLocaleDateString()}
                          {isOverdue && ' (Overdue)'}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {t.assignees && t.assignees.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {t.assignees.map((a) => (
                            <span
                              key={a.userId}
                              style={{
                                background: '#eff6ff',
                                color: '#1e40af',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 500
                              }}
                            >
                              {a.user.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
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
                          View
                        </Link>
                        <button
                          onClick={() => {
                            setEditingTask(t);
                            setIsModalOpen(true);
                          }}
                          style={{
                            background: 'transparent',
                            border: '1px solid #cbd5e1',
                            color: '#334155',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '13px',
                            cursor: 'pointer'
                          }}
                        >
                          Edit
                        </button>
                        {isManager && (
                          <button
                            onClick={() => handleDeleteTask(t)}
                            style={{
                              background: 'transparent',
                              border: '1px solid #fca5a5',
                              color: '#dc2626',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '13px',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
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

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
      />
    </div>
  );
}
