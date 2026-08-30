import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TaskModal from '../components/TaskModal';

export default function TaskDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isManager } = useAuth();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transitionError, setTransitionError] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  async function loadTask() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/tasks/${id}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load task details');
      }
      setTask(data.task);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTask();
  }, [id]);

  async function handleStatusTransition(targetStatus) {
    setTransitionError('');
    setIsTransitioning(true);
    try {
      const res = await fetch(`/api/tasks/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: targetStatus })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to transition to ${targetStatus}`);
      }

      await loadTask();
    } catch (err) {
      setTransitionError(err.message);
    } finally {
      setIsTransitioning(false);
    }
  }

  async function handleEditTask(payload) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update task');
    }

    await loadTask();
  }

  async function handleDeleteTask() {
    if (!window.confirm(`Are you sure you want to delete task "${task.title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete task');
      }
      navigate('/tasks');
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

  function getTransitionButtonLabel(targetStatus, currentStatus, previousStatus) {
    if (currentStatus === 'BLOCKED') {
      return `Unblock Task (to ${targetStatus})`;
    }
    if (currentStatus === 'DONE') {
      return `Reopen Task (to ${targetStatus})`;
    }
    if (targetStatus === 'IN_PROGRESS') {
      return 'Start Work → IN_PROGRESS';
    }
    if (targetStatus === 'IN_REVIEW') {
      return 'Request Review → IN_REVIEW';
    }
    if (targetStatus === 'DONE') {
      return 'Complete Task → DONE';
    }
    if (targetStatus === 'BLOCKED') {
      return 'Mark as BLOCKED';
    }
    return `Move to ${targetStatus}`;
  }

  function getTransitionButtonStyle(targetStatus) {
    switch (targetStatus) {
      case 'DONE':
        return { background: '#16a34a', color: '#ffffff' };
      case 'IN_PROGRESS':
        return { background: '#2563eb', color: '#ffffff' };
      case 'IN_REVIEW':
        return { background: '#7c3aed', color: '#ffffff' };
      case 'BLOCKED':
        return { background: '#dc2626', color: '#ffffff' };
      default:
        return { background: '#475569', color: '#ffffff' };
    }
  }

  function formatHistoryAction(h) {
    if (h.action === 'CREATED') {
      return 'created this task';
    }
    if (h.action === 'ASSIGNED') {
      return `assigned ${h.newValue}`;
    }
    if (h.action === 'UNASSIGNED') {
      return `unassigned ${h.oldValue}`;
    }
    if (h.action === 'STATUS_CHANGE') {
      return `changed status from ${h.oldValue} to ${h.newValue}`;
    }
    if (h.action === 'FIELD_UPDATE') {
      return `updated ${h.field}`;
    }
    if (h.action === 'DELETED') {
      return 'deleted this task';
    }
    return 'updated task';
  }

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
        Loading task details...
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
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Task Error</h2>
        <p style={{ fontSize: '14px' }}>{error}</p>
        <div style={{ marginTop: '16px' }}>
          <Link to="/tasks" style={{ color: '#2563eb', fontWeight: 600, fontSize: '14px' }}>
            ← Back to Tasks
          </Link>
        </div>
      </div>
    );
  }

  if (!task) return null;

  const pColor = getPriorityColor(task.priority);
  const sColor = getStatusColor(task.status);
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <div>
      {/* Breadcrumb Navigation */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
        <Link to="/tasks" style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>
          ← Back to Tasks
        </Link>
        <span style={{ color: '#cbd5e1' }}>|</span>
        <Link to={`/projects/${task.projectId}`} style={{ color: '#2563eb', fontSize: '14px', fontWeight: 500 }}>
          Project {task.project?.name}
        </Link>
      </div>

      {/* Transition Error Alert */}
      {transitionError && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#b91c1c',
          padding: '14px 18px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <strong>Status Transition Blocked:</strong> {transitionError}
          </div>
          <button
            onClick={() => setTransitionError('')}
            style={{ background: 'none', border: 'none', color: '#b91c1c', fontSize: '16px', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Task Header */}
      <div style={{
        background: '#ffffff',
        padding: '24px 28px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{
              background: '#f1f5f9',
              color: '#475569',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 700,
              fontFamily: 'monospace'
            }}>
              {task.project?.key}
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '9999px',
              background: pColor.bg,
              color: pColor.text,
              letterSpacing: '0.05em'
            }}>
              {task.priority}
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '9999px',
              background: sColor.bg,
              color: sColor.text,
              letterSpacing: '0.05em'
            }}>
              {task.status}
            </span>
            {task.previousStatus && (
              <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                (Blocked from {task.previousStatus})
              </span>
            )}
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
            {task.title}
          </h1>

          {/* Legal Status Transition Actions */}
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Workflow Actions:
            </span>
            {task.legalNextStatuses && task.legalNextStatuses.length > 0 ? (
              task.legalNextStatuses.map((nextSt) => {
                const btnStyle = getTransitionButtonStyle(nextSt);
                return (
                  <button
                    key={nextSt}
                    onClick={() => handleStatusTransition(nextSt)}
                    disabled={isTransitioning}
                    style={{
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: isTransitioning ? 'not-allowed' : 'pointer',
                      opacity: isTransitioning ? 0.6 : 1,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      ...btnStyle
                    }}
                  >
                    {getTransitionButtonLabel(nextSt, task.status, task.previousStatus)}
                  </button>
                );
              })
            ) : (
              <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                No further transitions available.
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsEditModalOpen(true)}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Edit Task
          </button>
          {isManager && (
            <button
              onClick={handleDeleteTask}
              style={{
                background: '#fee2e2',
                border: '1px solid #fca5a5',
                color: '#991b1b',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Delete Task
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Left Details & Right Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Description Card */}
          <div style={{
            background: '#ffffff',
            padding: '20px 24px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              Description
            </h2>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {task.description || 'No description provided.'}
            </p>
          </div>

          {/* Details & Attributes */}
          <div style={{
            background: '#ffffff',
            padding: '20px 24px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
              Task Information
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
              <div>
                <span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Project</span>
                <Link to={`/projects/${task.projectId}`} style={{ fontWeight: 600, color: '#2563eb' }}>
                  {task.project?.name}
                </Link>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Created By</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>
                  {task.creator?.name} ({task.creator?.email})
                </span>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Due Date</span>
                <span style={{ fontWeight: 600, color: isOverdue ? '#dc2626' : '#1e293b' }}>
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'None set'}
                  {isOverdue && ' (Overdue)'}
                </span>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Created At</span>
                <span style={{ color: '#1e293b' }}>
                  {new Date(task.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Assignees Card */}
          <div style={{
            background: '#ffffff',
            padding: '20px 24px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
              Assigned Team Members ({task.assignees?.length || 0})
            </h2>
            {task.assignees && task.assignees.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {task.assignees.map((a) => (
                  <div
                    key={a.userId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: '#f8fafc',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>
                        {a.user.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {a.user.email}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '9999px',
                      background: a.user.role === 'MANAGER' ? '#dbeafe' : '#f1f5f9',
                      color: a.user.role === 'MANAGER' ? '#1e40af' : '#475569'
                    }}>
                      {a.user.role}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
                No assignees currently set.
              </p>
            )}
          </div>

          {/* Blocking Dependencies Card */}
          <div style={{
            background: '#ffffff',
            padding: '20px 24px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
              Blocking Dependencies ({task.blockingDependencies?.length || 0})
            </h2>
            {task.blockingDependencies && task.blockingDependencies.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {task.blockingDependencies.map((d) => (
                  <Link
                    key={d.id}
                    to={`/tasks/${d.blockingTaskId}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: '#f8fafc',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      textDecoration: 'none'
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>
                      {d.blockingTask.title}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '9999px',
                      background: d.blockingTask.status === 'DONE' ? '#dcfce7' : '#fee2e2',
                      color: d.blockingTask.status === 'DONE' ? '#166534' : '#991b1b'
                    }}>
                      {d.blockingTask.status}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
                This task has no blocking dependencies.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Immutable Activity Timeline */}
        <div>
          <div style={{
            background: '#ffffff',
            padding: '20px 24px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
              Activity History
            </h2>

            {task.histories && task.histories.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {task.histories.map((h) => (
                  <div key={h.id} style={{ display: 'flex', gap: '10px', fontSize: '13px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#3b82f6',
                      marginTop: '6px',
                      flexShrink: 0
                    }} />
                    <div>
                      <p style={{ color: '#334155', lineHeight: 1.4 }}>
                        <strong>{h.user?.name || 'System'}</strong> {formatHistoryAction(h)}
                      </p>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {new Date(h.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
                No history recorded yet.
              </p>
            )}
          </div>
        </div>
      </div>

      <TaskModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditTask}
        task={task}
      />
    </div>
  );
}
