import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProjectModal from '../components/ProjectModal';
import AddMemberModal from '../components/AddMemberModal';

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isManager } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  async function loadProject() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/projects/${id}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load project');
      }
      setProject(data.project);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProject();
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

    await loadProject();
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
      await loadProject();
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

    await loadProject();
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
      await loadProject();
    } catch (err) {
      alert(err.message);
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
              <strong>Total Tasks:</strong> <span style={{ color: '#0f172a' }}>{project._count?.tasks || 0}</span>
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

      {/* Task System Notice (Phase 5) */}
      <div style={{
        background: '#f8fafc',
        padding: '24px',
        borderRadius: '12px',
        border: '1px dashed #cbd5e1',
        textAlign: 'center',
        color: '#64748b'
      }}>
        <p style={{ fontWeight: 600, fontSize: '15px', color: '#334155' }}>
          Tasks & Lifecycle Kanban Board
        </p>
        <p style={{ fontSize: '13px', marginTop: '4px' }}>
          This project currently holds {project._count?.tasks || 0} tasks. Full task management, lifecycle transitions, and dependency graphs will be initialized in subsequent phases.
        </p>
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
    </div>
  );
}
