import React, { useState, useEffect } from 'react';

export default function AddMemberModal({ isOpen, onClose, onAddMember, currentMemberIds = [] }) {
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setLoading(true);
      fetch('/api/users', { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => {
          if (data.users) {
            const nonMembers = data.users.filter((u) => !currentMemberIds.includes(u.id));
            setAvailableUsers(nonMembers);
            if (nonMembers.length > 0) {
              setSelectedUserId(nonMembers[0].id);
            }
          }
        })
        .catch((err) => {
          console.error('Failed to load users:', err);
          setError('Failed to load user list');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, currentMemberIds]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedUserId) return;
    setError('');
    setIsSubmitting(true);

    try {
      await onAddMember(selectedUserId);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add member');
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
        maxWidth: '440px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
            Add Project Member
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

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
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

          {loading ? (
            <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', padding: '16px 0' }}>
              Loading users...
            </p>
          ) : availableUsers.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', padding: '16px 0' }}>
              All users are already members of this project.
            </p>
          ) : (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Select User to Add
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
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
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.email} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
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
              disabled={isSubmitting || availableUsers.length === 0}
              style={{
                padding: '8px 18px',
                border: 'none',
                borderRadius: '6px',
                background: '#2563eb',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: (isSubmitting || availableUsers.length === 0) ? 'not-allowed' : 'pointer',
                opacity: (isSubmitting || availableUsers.length === 0) ? 0.6 : 1
              }}
            >
              {isSubmitting ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
