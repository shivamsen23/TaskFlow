import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TaskModal from '../components/TaskModal';

export default function TasksPage() {
  const { user, isManager } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [isOverdueOnly, setIsOverdueOnly] = useState(false);
  const [assignedToMeOnly, setAssignedToMeOnly] = useState(false);

  // Sorting
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Multi-select & Bulk Actions
  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('status'); // 'status', 'assignees', 'dueDate'
  const [bulkStatus, setBulkStatus] = useState('IN_PROGRESS');
  const [bulkAssigneeIds, setBulkAssigneeIds] = useState([]);
  const [bulkDueDate, setBulkDueDate] = useState('');
  const [isBulkExecuting, setIsBulkExecuting] = useState(false);
  const [bulkResults, setBulkResults] = useState(null); // { results: [], summary: {} }

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Load project options and user list for filter dropdowns
  useEffect(() => {
    fetch('/api/projects', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setProjects(data.projects || []))
      .catch((err) => console.error('Failed to fetch projects:', err));

    fetch('/api/users', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setUsersList(data.users || []))
      .catch((err) => console.error('Failed to fetch users:', err));
  }, []);

  // Fetch tasks with all server-side query parameters
  async function loadTasks() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      if (search.trim()) params.set('search', search.trim());
      if (selectedProject) params.set('project', selectedProject);
      if (selectedStatus) params.set('status', selectedStatus);
      if (selectedPriority) params.set('priority', selectedPriority);
      if (selectedAssignee) params.set('assignee', selectedAssignee);
      if (isOverdueOnly) params.set('overdue', 'true');
      if (assignedToMeOnly) params.set('assignedToMe', 'true');

      const res = await fetch(`/api/tasks?${params.toString()}`, { credentials: 'include' });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to fetch tasks');
      }

      setTasks(resData.data || resData.tasks || []);
      if (resData.pagination) {
        setPagination(resData.pagination);
      }
      // Clean selected tasks that are no longer in visible list
      setSelectedTaskIds(new Set());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Reload on query change
  useEffect(() => {
    loadTasks();
  }, [
    page,
    limit,
    selectedProject,
    selectedStatus,
    selectedPriority,
    selectedAssignee,
    isOverdueOnly,
    assignedToMeOnly,
    sortBy,
    sortOrder
  ]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    loadTasks();
  }

  function handleFilterChange(setter, value) {
    setter(value);
    setPage(1);
  }

  // Selection handlers
  function toggleSelectAllVisible() {
    if (selectedTaskIds.size === tasks.length && tasks.length > 0) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(tasks.map((t) => t.id)));
    }
  }

  function toggleSelectTask(id) {
    const next = new Set(selectedTaskIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedTaskIds(next);
  }

  // CSV Export Handler
  function handleExportCsv() {
    const params = new URLSearchParams();
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);

    if (search.trim()) params.set('search', search.trim());
    if (selectedProject) params.set('project', selectedProject);
    if (selectedStatus) params.set('status', selectedStatus);
    if (selectedPriority) params.set('priority', selectedPriority);
    if (selectedAssignee) params.set('assignee', selectedAssignee);
    if (isOverdueOnly) params.set('overdue', 'true');
    if (assignedToMeOnly) params.set('assignedToMe', 'true');

    window.open(`/api/tasks/export/csv?${params.toString()}`, '_blank');
  }

  // Bulk Action Execution Handler
  async function handleExecuteBulkAction() {
    if (selectedTaskIds.size === 0) return;

    setIsBulkExecuting(true);
    setBulkResults(null);

    const payload = {
      taskIds: Array.from(selectedTaskIds),
      action: bulkAction
    };

    if (bulkAction === 'status') {
      payload.status = bulkStatus;
    } else if (bulkAction === 'assignees') {
      payload.assigneeIds = bulkAssigneeIds;
    } else if (bulkAction === 'dueDate') {
      payload.dueDate = bulkDueDate ? new Date(bulkDueDate).toISOString() : null;
    }

    try {
      const res = await fetch('/api/tasks/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Bulk operation failed');
      }

      setBulkResults(data);
      await loadTasks();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsBulkExecuting(false);
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

  const startRecord = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endRecord = Math.min(pagination.page * pagination.limit, pagination.total);
  const isAllVisibleSelected = tasks.length > 0 && selectedTaskIds.size === tasks.length;

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
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
            Tasks
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
            Server-side search, filtering, bulk actions, and CSV export.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleExportCsv}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              padding: '9px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📥</span> Export CSV
          </button>

          <button
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            style={{
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '9px 18px',
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
      </div>

      {/* Filter and Search Panel */}
      <div style={{
        background: '#ffffff',
        padding: '18px 20px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {/* Row 1: Search Form */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks by title or description... (Press Enter)"
              style={{
                width: '100%',
                padding: '9px 14px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              padding: '9px 18px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              style={{
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                padding: '9px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          )}
        </form>

        {/* Row 2: Filter Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Project Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Project:</label>
            <select
              value={selectedProject}
              onChange={(e) => handleFilterChange(setSelectedProject, e.target.value)}
              style={{
                padding: '7px 10px',
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

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Status:</label>
            <select
              value={selectedStatus}
              onChange={(e) => handleFilterChange(setSelectedStatus, e.target.value)}
              style={{
                padding: '7px 10px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '13px',
                background: '#ffffff',
                outline: 'none'
              }}
            >
              <option value="">All Statuses</option>
              <option value="BACKLOG">BACKLOG</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="IN_REVIEW">IN_REVIEW</option>
              <option value="BLOCKED">BLOCKED</option>
              <option value="DONE">DONE</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Priority:</label>
            <select
              value={selectedPriority}
              onChange={(e) => handleFilterChange(setSelectedPriority, e.target.value)}
              style={{
                padding: '7px 10px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '13px',
                background: '#ffffff',
                outline: 'none'
              }}
            >
              <option value="">All Priorities</option>
              <option value="URGENT">URGENT</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          {/* Assignee Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Assignee:</label>
            <select
              value={selectedAssignee}
              onChange={(e) => handleFilterChange(setSelectedAssignee, e.target.value)}
              style={{
                padding: '7px 10px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '13px',
                background: '#ffffff',
                outline: 'none'
              }}
            >
              <option value="">All Assignees</option>
              {usersList.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Overdue Checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#b91c1c', fontWeight: 600, cursor: 'pointer', marginLeft: '4px' }}>
            <input
              type="checkbox"
              checked={isOverdueOnly}
              onChange={(e) => handleFilterChange(setIsOverdueOnly, e.target.checked)}
            />
            <span>Overdue Only</span>
          </label>

          {/* Assigned To Me Checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#1e40af', fontWeight: 600, cursor: 'pointer', marginLeft: '4px' }}>
            <input
              type="checkbox"
              checked={assignedToMeOnly}
              onChange={(e) => handleFilterChange(setAssignedToMeOnly, e.target.checked)}
            />
            <span>Assigned to Me</span>
          </label>
        </div>

        {/* Row 3: Sorting & Counter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '10px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => handleFilterChange(setSortBy, e.target.value)}
              style={{
                padding: '6px 10px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '13px',
                background: '#ffffff',
                outline: 'none'
              }}
            >
              <option value="createdAt">Creation Date</option>
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="updatedAt">Last Updated</option>
              <option value="title">Title</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => handleFilterChange(setSortOrder, e.target.value)}
              style={{
                padding: '6px 10px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '13px',
                background: '#ffffff',
                outline: 'none'
              }}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Showing <strong>{startRecord}–{endRecord}</strong> of <strong>{pagination.total}</strong> matching tasks
          </div>
        </div>
      </div>

      {/* Bulk Results Summary Modal / Banner */}
      {bulkResults && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '10px',
          padding: '16px 20px',
          marginBottom: '20px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                Bulk Action Results: {bulkResults.summary.successful} succeeded, {bulkResults.summary.failed} rejected
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b' }}>
                Each task was processed independently according to business rules.
              </p>
            </div>
            <button
              onClick={() => setBulkResults(null)}
              style={{ background: 'none', border: 'none', fontSize: '18px', color: '#64748b', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
            {bulkResults.results.map((r, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  background: r.success ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${r.success ? '#bbf7d0' : '#fecaca'}`
                }}
              >
                <div style={{ fontWeight: 600, color: '#1e293b' }}>
                  {r.title}
                </div>
                <div>
                  {r.success ? (
                    <span style={{ color: '#166534', fontWeight: 600 }}>✓ Success</span>
                  ) : (
                    <span style={{ color: '#b91c1c', fontWeight: 500 }}>
                      ✗ Rejected: {r.reason}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedTaskIds.size > 0 && (
        <div style={{
          background: '#0f172a',
          color: '#ffffff',
          padding: '14px 20px',
          borderRadius: '10px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              background: '#2563eb',
              color: '#ffffff',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 700
            }}>
              {selectedTaskIds.size} selected
            </span>

            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #334155',
                background: '#1e293b',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none'
              }}
            >
              <option value="status">Change Status</option>
              <option value="assignees">Change Assignees</option>
              <option value="dueDate">Change Due Date</option>
            </select>

            {/* Action Dynamic Inputs */}
            {bulkAction === 'status' && (
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  background: '#1e293b',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              >
                <option value="BACKLOG">BACKLOG</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="IN_REVIEW">IN_REVIEW</option>
                <option value="BLOCKED">BLOCKED</option>
                <option value="DONE">DONE</option>
              </select>
            )}

            {bulkAction === 'assignees' && (
              <select
                value={bulkAssigneeIds[0] || ''}
                onChange={(e) => setBulkAssigneeIds(e.target.value ? [e.target.value] : [])}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  background: '#1e293b',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              >
                <option value="">Unassign All</option>
                {usersList.map((u) => (
                  <option key={u.id} value={u.id}>
                    Assign to {u.name}
                  </option>
                ))}
              </select>
            )}

            {bulkAction === 'dueDate' && (
              <input
                type="date"
                value={bulkDueDate}
                onChange={(e) => setBulkDueDate(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  background: '#1e293b',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleExecuteBulkAction}
              disabled={isBulkExecuting}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '7px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: isBulkExecuting ? 'not-allowed' : 'pointer',
                opacity: isBulkExecuting ? 0.6 : 1
              }}
            >
              {isBulkExecuting ? 'Applying...' : `Apply to ${selectedTaskIds.size} Tasks`}
            </button>

            <button
              onClick={() => setSelectedTaskIds(new Set())}
              style={{
                background: 'transparent',
                border: '1px solid #475569',
                color: '#cbd5e1',
                padding: '7px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

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
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        marginBottom: '20px'
      }}>
        {loading ? (
          <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>
            Loading tasks from server...
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#334155' }}>
              No matching tasks found
            </p>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
              Try adjusting or resetting your search filters.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 14px', width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isAllVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                const isSelected = selectedTaskIds.has(t.id);

                return (
                  <tr
                    key={t.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: isSelected ? '#f8fafc' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '14px 14px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectTask(t.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '14px 16px' }}>
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

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 16px',
          background: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total items)
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              style={{
                padding: '6px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                background: '#ffffff',
                fontSize: '13px',
                color: pagination.page <= 1 ? '#94a3b8' : '#334155',
                cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              ← Previous
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pNum) => (
              <button
                key={pNum}
                onClick={() => setPage(pNum)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: pagination.page === pNum ? 700 : 400,
                  background: pagination.page === pNum ? '#2563eb' : '#ffffff',
                  color: pagination.page === pNum ? '#ffffff' : '#334155',
                  border: pagination.page === pNum ? 'none' : '1px solid #cbd5e1',
                  cursor: 'pointer'
                }}
              >
                {pNum}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page >= pagination.totalPages}
              style={{
                padding: '6px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                background: '#ffffff',
                fontSize: '13px',
                color: pagination.page >= pagination.totalPages ? '#94a3b8' : '#334155',
                cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
      />
    </div>
  );
}
