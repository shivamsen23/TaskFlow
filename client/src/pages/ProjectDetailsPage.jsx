import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProjectModal from '../components/ProjectModal';
import AddMemberModal from '../components/AddMemberModal';
import TaskModal from '../components/TaskModal';

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isManager } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  async function loadProjectAndTasks() {
    setLoading(true);
    setError('');
    try {
      const [projRes, tasksRes] = await Promise.all([
        fetch(`/api/projects/${id}`, { credentials: 'include' }),
        fetch(`/api/tasks?projectId=${id}`, { credentials: 'include' })
      ]);

      const projData = await projRes.json();
      if (!projRes.ok) {
        throw new Error(projData.error || 'Failed to load project');
      }
      setProject(projData.project);

      const tasksData = await tasksRes.json();
      if (tasksRes.ok) {
        setTasks(tasksData.tasks || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjectAndTasks();
  }, [id]);

  async function handleEditProject(payload) {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update project');
    }

    await loadProjectAndTasks();
  }

  async function handleToggleArchive() {
    if (!project) return;
    const action = project.archived ? 'restore' : 'archive';
    const confirmMessage = project.archived
      ? `Are you sure you want to restore project "${project.name}"?`
      : `Are you sure you want to archive project "${project.name}"?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/projects/${project.id}/${action}`, {
        method: 'PATCH',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to ${action} project`);
      }
      await loadProjectAndTasks();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleAddMember(targetUserId) {
    const res = await fetch(`/api/projects/${id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId: targetUserId })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to add member');
    }

    await loadProjectAndTasks();
  }

  async function handleRemoveMember(targetMember) {
    if (targetMember.userId === project.ownerId) {
      alert('Cannot remove the project owner. Transfer ownership before removing this user.');
      return;
    }

    const confirmMessage = `Are you sure you want to remove ${targetMember.user.name} from this project? Any tasks assigned to them in this project will be automatically unassigned.`;
    if (!window.confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/projects/${id}/members/${targetMember.userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove member');
      }
      await loadProjectAndTasks();
    } catch (err) {
      alert(err.message);
    }
  }

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

    await loadProjectAndTasks();
  }

  async function handleDeleteTask(taskId, taskTitle) {
    if (!window.confirm(`Are you sure you want to delete task "${taskTitle}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete task');
      }
      await loadProjectAndTasks();
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

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
        Loading project details...
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
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Access Error</h2>
        <p style={{ fontSize: '14px' }}>{error}</p>
        <div style={{ marginTop: '16px' }}>
          <Link to="/projects" style={{ color: '#2563eb', fontWeight: 600, fontSize: '14px' }}>
            ← Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div>
      {/* Breadcrumb / Back Link */}
      <div style={{ marginBottom: '16px' }}>
        <Link to="/projects" style={{ color: '#64748b', fontSize: '14px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          ← Back to Projects
        </Link>
      </div>

      {/* Project Header Card */}
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
        gap: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
              {project.name}
            </h1>
            <span style={{
              background: '#f1f5f9',
              color: '#334155',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: 'monospace'
            }}>
              {project.key}
            </span>
            <span style={{
              fontSize: '12px',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '9999px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              background: project.archived ? '#f1f5f9' : '#dcfce7',
              color: project.archived ? '#64748b' : '#166534'
            }}>
              {project.archived ? 'Archived' : 'Active'}
            </span>
          </div>

          <p style={{ color: '#475569', fontSize: '15px', maxWidth: '680px', lineHeight: 1.5 }}>
            {project.description || 'No description provided for this project.'}
          </p>

          <div style={{ display: 'flex', gap: '24px', marginTop: '16px', fontSize: '13px', color: '#64748b' }}>
            <div>
              <strong>Owner:</strong> <span style={{ color: '#0f172a' }}>{project.owner?.name}</span> ({project.owner?.email})
            </div>
            <div>
              <strong>Created:</strong> <span style={{ color: '#0f172a' }}>{new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
            <div>
              <strong>Total Tasks:</strong> <span style={{ color: '#0f172a' }}>{tasks.length}</span>
            </div>
          </div>
        </div>

        {isManager && (
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
              Edit Project
            </button>
            <button
              onClick={handleToggleArchive}
              style={{
                background: project.archived ? '#dcfce7' : '#fee2e2',
                border: `1px solid ${project.archived ? '#86efac' : '#fca5a5'}`,
                color: project.archived ? '#166534' : '#991b1b',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {project.archived ? 'Restore Project' : 'Archive Project'}
            </button>
          </div>
        )}
      </div>

      {/* Project Team Members Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        marginBottom: '24px'
      }}>
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              Project Team ({project.members?.length || 0})
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
              Members who have access to view this project and receive task assignments.
            </p>
          </div>

          {isManager && (
            <button
              onClick={() => setIsAddMemberModalOpen(true)}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              + Add Member
            </button>
          )}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Name & Email
              </th>
              <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                System Role
              </th>
              <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Project Role
              </th>
              <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Joined Date
              </th>
              {isManager && (
                <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {project.members?.map((m) => {
              const isOwner = m.userId === project.ownerId;
              return (
                <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 24px' }}>
                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px' }}>
                      {m.user.name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      {m.user.email}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      textTransform: 'uppercase',
                      background: m.user.role === 'MANAGER' ? '#dbeafe' : '#f1f5f9',
                      color: m.user.role === 'MANAGER' ? '#1e40af' : '#475569'
                    }}>
                      {m.user.role}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px' }}>
                    {isOwner ? (
                      <span style={{ fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '2px 8px', borderRadius: '4px' }}>
                        Project Owner
                      </span>
                    ) : (
                      <span style={{ color: '#475569' }}>Member</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b' }}>
                    {new Date(m.joinedAt).toLocaleDateString()}
                  </td>
                  {isManager && (
                    <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                      {isOwner ? (
                        <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                          Owner
                        </span>
                      ) : (
                        <button
                          onClick={() => handleRemoveMember(m)}
                          style={{
                            background: 'transparent',
                            border: '1px solid #fca5a5',
                            color: '#b91c1c',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Project Tasks Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        marginBottom: '24px'
      }}>
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              Project Tasks ({tasks.length})
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
              Tasks belonging to this project workspace.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
            style={{
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            + New Task
          </button>
        </div>

        {tasks.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#334155' }}>
              No tasks in this project yet
            </p>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              Click "+ New Task" above to create the first task in this workspace.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Title
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
                <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>
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
                    <td style={{ padding: '14px 24px' }}>
                      <Link
                        to={`/tasks/${t.id}`}
                        style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px', textDecoration: 'none' }}
                        onMouseOver={(e) => (e.currentTarget.style.color = '#2563eb')}
                        onMouseOut={(e) => (e.currentTarget.style.color = '#1e293b')}
                      >
                        {t.title}
                      </Link>
                      {t.description && (
                        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', maxWidth: '340px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                    <td style={{ padding: '14px 24px', textAlign: 'right' }}>
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
                            setIsTaskModalOpen(true);
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
                            onClick={() => handleDeleteTask(t.id, t.title)}
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

      <ProjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditProject}
        project={project}
      />

      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        onAddMember={handleAddMember}
        currentMemberIds={project.members?.map((m) => m.userId) || []}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
        initialProjectId={project.id}
      />
    </div>
  );
}
