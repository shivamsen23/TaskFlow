import React, { useState, useEffect } from 'react';

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  task = null,
  initialProjectId = null
}) {
  const isEdit = !!task;

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectMembers, setProjectMembers] = useState([]);
  const [projectTasks, setProjectTasks] = useState([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [status, setStatus] = useState('BACKLOG');
  const [dueDate, setDueDate] = useState('');
  const [assigneeIds, setAssigneeIds] = useState([]);
  const [blockingTaskIds, setBlockingTaskIds] = useState([]);

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load accessible projects on open
  useEffect(() => {
    if (isOpen) {
      setError('');
      fetch('/api/projects', { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => {
          const list = data.projects || [];
          setProjects(list);

          const defaultProjId = task?.projectId || initialProjectId || (list.length > 0 ? list[0].id : '');
          setSelectedProjectId(defaultProjId);
        })
        .catch((err) => console.error('Failed to load projects:', err));

      if (task) {
        setTitle(task.title || '');
        setDescription(task.description || '');
        setPriority(task.priority || 'MEDIUM');
        setStatus(task.status || 'BACKLOG');
        setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
        setAssigneeIds(task.assignees ? task.assignees.map((a) => a.userId) : []);
        setBlockingTaskIds(task.blockingDependencies ? task.blockingDependencies.map((d) => d.blockingTaskId) : []);
      } else {
        setTitle('');
        setDescription('');
        setPriority('MEDIUM');
        setStatus('BACKLOG');
        setDueDate('');
        setAssigneeIds([]);
        setBlockingTaskIds([]);
      }
    }
  }, [isOpen, task, initialProjectId]);

  // When selected project changes, load its members and existing tasks for dependencies
  useEffect(() => {
    if (selectedProjectId) {
      fetch(`/api/projects/${selectedProjectId}`, { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => {
          if (data.project) {
            setProjectMembers(data.project.members || []);
          }
        })
        .catch((err) => console.error('Failed to load project details:', err));

      fetch(`/api/tasks?projectId=${selectedProjectId}`, { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => {
          const tasksInProj = (data.tasks || []).filter((t) => t.id !== task?.id);
          setProjectTasks(tasksInProj);
        })
        .catch((err) => console.error('Failed to load project tasks:', err));
    } else {
      setProjectMembers([]);
      setProjectTasks([]);
    }
  }, [selectedProjectId, task?.id]);

  if (!isOpen) return null;

  function toggleAssignee(userId) {
    setAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  function toggleBlockingTask(bTaskId) {
    setBlockingTaskIds((prev) =>
      prev.includes(bTaskId) ? prev.filter((id) => id !== bTaskId) : [...prev, bTaskId]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        assigneeIds,
        blockingTaskIds
      };

      if (!isEdit) {
        payload.projectId = selectedProjectId;
      }

      await onSave(payload, task?.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '16px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '640px',
        maxHeight: '90vh',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
            {isEdit ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          {/* Project Selection */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Project *
            </label>
            <select
              required
              disabled={isEdit}
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setAssigneeIds([]);
                setBlockingTaskIds([]);
              }}
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '14px',
                background: isEdit ? '#f8fafc' : '#ffffff',
                color: isEdit ? '#64748b' : '#0f172a',
                outline: 'none'
              }}
            >
              <option value="" disabled>Select a project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.key}] {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Task Title */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement API authentication middleware"
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the task requirements..."
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Priority & Status Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: '#ffffff',
                  outline: 'none'
                }}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: '#ffffff',
                  outline: 'none'
                }}
              >
                <option value="BACKLOG">BACKLOG</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="IN_REVIEW">IN_REVIEW</option>
                <option value="BLOCKED">BLOCKED</option>
                <option value="DONE">DONE</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Due Date (Optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '14px',
                background: '#ffffff',
                outline: 'none'
              }}
            />
          </div>

          {/* Assignees Selection (Project Members Only) */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Assignees (Project Members Only)
            </label>
            {projectMembers.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
                Select a project with members to assign team members.
              </p>
            ) : (
              <div style={{
                maxHeight: '120px',
                overflowY: 'auto',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '8px'
              }}>
                {projectMembers.map((m) => (
                  <label
                    key={m.userId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: '#1e293b',
                      background: assigneeIds.includes(m.userId) ? '#eff6ff' : 'transparent'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={assigneeIds.includes(m.userId)}
                      onChange={() => toggleAssignee(m.userId)}
                    />
                    <span>{m.user.name}</span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>({m.user.email})</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Blocking Task Dependencies */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Blocking Dependencies (Tasks that must be completed first)
            </label>
            {projectTasks.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
                No other tasks in this project available to set as dependencies.
              </p>
            ) : (
              <div style={{
                maxHeight: '120px',
                overflowY: 'auto',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '8px'
              }}>
                {projectTasks.map((pt) => (
                  <label
                    key={pt.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: '#1e293b',
                      background: blockingTaskIds.includes(pt.id) ? '#eff6ff' : 'transparent'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={blockingTaskIds.includes(pt.id)}
                      onChange={() => toggleBlockingTask(pt.id)}
                    />
                    <span style={{ fontWeight: 500 }}>{pt.title}</span>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>[{pt.status}]</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                background: '#ffffff',
                color: '#475569',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedProjectId}
              style={{
                padding: '8px 18px',
                border: 'none',
                borderRadius: '6px',
                background: '#2563eb',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: (isSubmitting || !selectedProjectId) ? 'not-allowed' : 'pointer',
                opacity: (isSubmitting || !selectedProjectId) ? 0.7 : 1
              }}
            >
              {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
