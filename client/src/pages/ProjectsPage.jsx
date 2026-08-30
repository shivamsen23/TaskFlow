import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProjectModal from '../components/ProjectModal';

export default function ProjectsPage() {
  const { user, isManager } = useAuth();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // 'active', 'archived', 'all'

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  async function loadProjects() {
    setLoading(true);
    setError('');
    try {
      let url = `/api/projects?search=${encodeURIComponent(search)}`;
      if (statusFilter === 'archived') {
        url += '&archived=true';
      } else if (statusFilter === 'all') {
        url += '&archived=all';
      } else {
        url += '&archived=false';
      }

      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch projects');
      }
      setProjects(data.projects || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, [search, statusFilter]);

  async function handleSaveProject(payload, projectId) {
    const isEdit = !!projectId;
    const url = isEdit ? `/api/projects/${projectId}` : '/api/projects';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to save project');
    }

    await loadProjects();
  }

  async function handleToggleArchive(project) {
    const action = project.archived ? 'restore' : 'archive';
    const confirmMessage = project.archived
      ? `Are you sure you want to restore project "${project.name}"?`
      : `Are you sure you want to archive project "${project.name}"? It will be hidden from default views.`;

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
      await loadProjects();
    } catch (err) {
      alert(err.message);
    }
  }

  function openCreateModal() {
    setEditingProject(null);
    setIsModalOpen(true);
  }

  function openEditModal(project) {
    setEditingProject(project);
    setIsModalOpen(true);
  }

  return (
    <div>
      {/* Top Header */}
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
            Projects
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
            {isManager
              ? 'Manage company projects, assign owners, and organize team membership.'
              : 'Projects you are currently assigned to as a team member.'}
          </p>
        </div>

        {isManager && (
          <button
            onClick={openCreateModal}
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
            <span>+</span> New Project
          </button>
        )}
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
            placeholder="Search projects by name, key, or description..."
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

        {isManager && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>
              Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '13px',
                background: '#ffffff',
                outline: 'none'
              }}
            >
              <option value="active">Active Only</option>
              <option value="archived">Archived Only</option>
              <option value="all">All Projects</option>
            </select>
          </div>
        )}
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

      {/* Projects Table */}
      <div style={{
        background: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
      }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#334155' }}>
              No projects found
            </p>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
              {search ? 'Try adjusting your search query.' : 'Get started by creating your first project.'}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Project Name
                </th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Key
                </th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Manager / Owner
                </th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Status
                </th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Members
                </th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Tasks
                </th>
                <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <Link
                      to={`/projects/${p.id}`}
                      style={{ fontWeight: 600, color: '#1e293b', fontSize: '15px', textDecoration: 'none' }}
                      onMouseOver={(e) => (e.currentTarget.style.color = '#2563eb')}
                      onMouseOut={(e) => (e.currentTarget.style.color = '#1e293b')}
                    >
                      {p.name}
                    </Link>
                    {p.description && (
                      <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px', maxWidth: '360px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.description}
                      </p>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      background: '#f1f5f9',
                      color: '#475569',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 700,
                      fontFamily: 'monospace'
                    }}>
                      {p.key}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#334155' }}>
                    {p.owner?.name || '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      background: p.archived ? '#f1f5f9' : '#dcfce7',
                      color: p.archived ? '#64748b' : '#166534'
                    }}>
                      {p.archived ? 'Archived' : 'Active'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b' }}>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{p._count?.members || p.members?.length || 0}</span> members
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b' }}>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{p._count?.tasks || 0}</span> tasks
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <Link
                        to={`/projects/${p.id}`}
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
                      {isManager && (
                        <>
                          <button
                            onClick={() => openEditModal(p)}
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
                          <button
                            onClick={() => handleToggleArchive(p)}
                            style={{
                              background: 'transparent',
                              border: '1px solid #cbd5e1',
                              color: p.archived ? '#059669' : '#dc2626',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '13px',
                              cursor: 'pointer'
                            }}
                          >
                            {p.archived ? 'Restore' : 'Archive'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProject}
        project={editingProject}
      />
    </div>
  );
}
