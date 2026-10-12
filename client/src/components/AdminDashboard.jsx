import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  Calendar as CalendarIcon, 
  AlertCircle, 
  CheckCircle, 
  CheckCircle2,
  XCircle,
  AlertTriangle,
  PlusCircle,
  Users, 
  Settings, 
  History, 
  Plus, 
  ShieldCheck, 
  Sliders,
  Trash2,
  Clock,
  User,
  Search,
  Filter,
  RefreshCw,
  Activity
} from 'lucide-react';

const formatActivityTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const formattedDate = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const formattedTime = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  return `${formattedDate} • ${formattedTime}`;
};

const getRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const d = new Date(dateStr);
  const diffSec = Math.floor((now - d) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getActionMeta = (action) => {
  switch (action) {
    case 'BOOKING_APPROVED':
      return {
        label: 'Approved',
        badgeBg: '#ecfdf5',
        badgeColor: '#047857',
        badgeBorder: '#a7f3d0',
        iconBg: '#dcfce7',
        iconColor: '#16a34a',
        accentBorder: '#16a34a',
        Icon: CheckCircle2,
        category: 'approval'
      };
    case 'BOOKING_CREATED':
      return {
        label: 'Booking Request',
        badgeBg: '#eff6ff',
        badgeColor: '#1d4ed8',
        badgeBorder: '#bfdbfe',
        iconBg: '#e0f2fe',
        iconColor: '#0284c7',
        accentBorder: '#0284c7',
        Icon: PlusCircle,
        category: 'booking'
      };
    case 'BOOKING_REJECTED':
      return {
        label: 'Rejected',
        badgeBg: '#fef2f2',
        badgeColor: '#b91c1c',
        badgeBorder: '#fecaca',
        iconBg: '#fee2e2',
        iconColor: '#dc2626',
        accentBorder: '#dc2626',
        Icon: XCircle,
        category: 'approval'
      };
    case 'BOOKING_CANCELLED':
      return {
        label: 'Cancelled',
        badgeBg: '#fffbeb',
        badgeColor: '#b45309',
        badgeBorder: '#fde68a',
        iconBg: '#fef3c7',
        iconColor: '#d97706',
        accentBorder: '#d97706',
        Icon: AlertTriangle,
        category: 'booking'
      };
    case 'BOOKING_UPDATED':
      return {
        label: 'Booking Updated',
        badgeBg: '#f0fdf4',
        badgeColor: '#15803d',
        badgeBorder: '#bbf7d0',
        iconBg: '#dcfce7',
        iconColor: '#15803d',
        accentBorder: '#15803d',
        Icon: CalendarIcon,
        category: 'booking'
      };
    case 'ADMIN_HALL_UPDATED':
      return {
        label: 'Hall Config',
        badgeBg: '#faf5ff',
        badgeColor: '#7e22ce',
        badgeBorder: '#e9d5ff',
        iconBg: '#f3e8ff',
        iconColor: '#9333ea',
        accentBorder: '#9333ea',
        Icon: Building2,
        category: 'admin'
      };
    case 'ADMIN_USER_CREATED':
    case 'ADMIN_USER_UPDATED':
    case 'ADMIN_USER_DEACTIVATED':
      return {
        label: action === 'ADMIN_USER_DEACTIVATED' ? 'User Disabled' : 'User Setting',
        badgeBg: '#eef2ff',
        badgeColor: '#4338ca',
        badgeBorder: '#c7d2fe',
        iconBg: '#e0e7ff',
        iconColor: '#4f46e5',
        accentBorder: '#4f46e5',
        Icon: Users,
        category: 'admin'
      };
    case 'ADMIN_CLUB_CREATED':
    case 'ADMIN_CLUB_UPDATED':
    case 'ADMIN_CLUB_DELETED':
      return {
        label: 'Club Updated',
        badgeBg: '#ecfeff',
        badgeColor: '#0e7490',
        badgeBorder: '#a5f3fc',
        iconBg: '#cffafe',
        iconColor: '#0891b2',
        accentBorder: '#0891b2',
        Icon: ShieldCheck,
        category: 'admin'
      };
    default:
      return {
        label: (action || 'System').replace(/_/g, ' '),
        badgeBg: '#f8fafc',
        badgeColor: '#475569',
        badgeBorder: '#e2e8f0',
        iconBg: '#f1f5f9',
        iconColor: '#64748b',
        accentBorder: '#64748b',
        Icon: History,
        category: 'other'
      };
  }
};

export const AdminDashboard = ({ hallInfo, onUpdateHall, clubs = [], onRefreshClubs }) => {
  const { user } = useAuth();
  const [activeSubtab, setActiveSubtab] = useState('overview'); // 'overview', 'halls', 'users', 'clubs', 'audit'
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityFilter, setActivityFilter] = useState('all'); // 'all', 'approval', 'booking', 'admin'
  const [activitySearch, setActivitySearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // User creation modal
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('EVENT_COORDINATOR');

  // Club creation modal
  const [showClubModal, setShowClubModal] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [newClubDept, setNewClubDept] = useState('');

  // Hall edit
  const [hallCapacity, setHallCapacity] = useState(hallInfo?.capacity || 250);
  const [hallLocation, setHallLocation] = useState(hallInfo?.location || 'Main Campus Block, Ground Floor');
  const [hallActive, setHallActive] = useState(hallInfo?.isActive ?? true);
  const [hallSaveMsg, setHallSaveMsg] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [uRes, bRes, aRes] = await Promise.all([
        api.getUsers(),
        api.getBookings(),
        api.getAuditLogs({ limit: 30 })
      ]);
      if (uRes.success) setUsers(uRes.data);
      if (bRes.success) setBookings(bRes.data);
      if (aRes.success) setAuditLogs(aRes.data);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleRefreshActivity = async () => {
    setRefreshing(true);
    await fetchAdminData();
    setTimeout(() => setRefreshing(false), 300);
  };

  const filteredAuditLogs = auditLogs.filter(log => {
    const meta = getActionMeta(log.action);
    if (activityFilter !== 'all' && meta.category !== activityFilter) {
      return false;
    }
    if (activitySearch.trim()) {
      const q = activitySearch.toLowerCase();
      const matchDetails = log.details?.toLowerCase().includes(q);
      const matchPerformer = log.performedBy?.name?.toLowerCase().includes(q) || log.performedBy?.email?.toLowerCase().includes(q);
      const matchAction = log.action?.toLowerCase().includes(q) || meta.label.toLowerCase().includes(q);
      if (!matchDetails && !matchPerformer && !matchAction) {
        return false;
      }
    }
    return true;
  });

  const handleToggleUser = async (id) => {
    try {
      await api.toggleUserActive(id);
      fetchAdminData();
    } catch (err) {
      alert(err.message || 'Failed to toggle user status.');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.createUser({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole
      });
      setShowUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      fetchAdminData();
    } catch (err) {
      alert(err.message || 'Failed to create user.');
    }
  };

  const handleCreateClub = async (e) => {
    e.preventDefault();
    try {
      await api.createClub({
        name: newClubName,
        department: newClubDept
      });
      setShowClubModal(false);
      setNewClubName('');
      setNewClubDept('');
      onRefreshClubs();
      fetchAdminData();
    } catch (err) {
      alert(err.message || 'Failed to register club.');
    }
  };

  const handleDeleteClub = async (id, clubName) => {
    if (!window.confirm(`Are you sure you want to delete club '${clubName}'?`)) return;
    try {
      await api.deleteClub(id);
      onRefreshClubs();
      fetchAdminData();
    } catch (err) {
      alert(err.message || 'Failed to delete club.');
    }
  };

  const handleSaveHall = async (e) => {
    e.preventDefault();
    try {
      const res = await api.updateHall({
        capacity: Number(hallCapacity),
        location: hallLocation,
        isActive: hallActive
      });
      if (res.success) {
        setHallSaveMsg('Hall configuration updated successfully!');
        onUpdateHall(res.data);
        setTimeout(() => setHallSaveMsg(''), 3000);
      }
    } catch (err) {
      alert(err.message || 'Failed to update hall.');
    }
  };

  const pendingApprovalsCount = bookings.filter(b => b.status === 'PENDING').length;

  return (
    <div>
      {/* Header matching Screenshot 5 */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Hello Administrator {user?.name || 'Administrator'}
          </h1>
          <p className="page-subtitle">
            Oversee hall management and system administration
          </p>
        </div>

        <button
          onClick={() => setActiveSubtab(activeSubtab === 'overview' ? 'halls' : 'overview')}
          className="btn btn-purple"
          style={{ gap: 8 }}
        >
          <Sliders size={16} /> Manage System
        </button>
      </div>

      {/* Metric Cards Row matching Screenshot 5 */}
      <div className="metrics-grid">
        {/* Metric 1: Total Halls */}
        <div className="metric-card">
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#e0f2fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0284c7',
            flexShrink: 0
          }}>
            <Building2 size={24} />
          </div>
          <div>
            <div className="metric-label">Total Halls</div>
            <div className="metric-value">1</div>
            <div className="metric-sub">1 Active Hall (250 Seats)</div>
          </div>
        </div>

        {/* Metric 2: Total Requests */}
        <div className="metric-card">
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#dcfce7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#16a34a',
            flexShrink: 0
          }}>
            <CalendarIcon size={24} />
          </div>
          <div>
            <div className="metric-label">Total Requests</div>
            <div className="metric-value">{bookings.length}</div>
          </div>
        </div>

        {/* Metric 3: Pending Approvals */}
        <div className="metric-card">
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#fef3c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#d97706',
            flexShrink: 0
          }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <div className="metric-label">Pending Approvals</div>
            <div className="metric-value">{pendingApprovalsCount}</div>
          </div>
        </div>

        {/* Metric 4: System Health */}
        <div className="metric-card">
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#dcfce7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#16a34a',
            flexShrink: 0
          }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="metric-label">System Health</div>
            <div className="metric-value" style={{ color: '#16a34a', fontSize: '1.75rem' }}>Good</div>
          </div>
        </div>
      </div>

      {/* Subtabs Bar for Admin Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <button
          onClick={() => setActiveSubtab('overview')}
          className={`btn btn-sm ${activeSubtab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Activity Overview
        </button>
        <button
          onClick={() => setActiveSubtab('halls')}
          className={`btn btn-sm ${activeSubtab === 'halls' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Manage Halls
        </button>
        <button
          onClick={() => setActiveSubtab('users')}
          className={`btn btn-sm ${activeSubtab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Users ({users.length})
        </button>
        <button
          onClick={() => setActiveSubtab('clubs')}
          className={`btn btn-sm ${activeSubtab === 'clubs' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Clubs ({clubs.length})
        </button>
      </div>

      {/* Main Panel: Recent System Activity matching Screenshot 5 */}
      {activeSubtab === 'overview' && (
        <div className="content-card">
          {/* Header area with Live Audit Feed pill, filters, search and refresh */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 16
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h2 className="content-card-title" style={{ margin: 0 }}>Recent System Activity</h2>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 9999,
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  color: '#475569',
                  fontSize: '0.76rem',
                  fontWeight: 700
                }}>
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)'
                  }} />
                  Live Audit Feed ({filteredAuditLogs.length} of {auditLogs.length})
                </div>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Comprehensive verified activity history across reservation approvals, submissions, and facility modifications.
              </p>
            </div>

            {/* Quick Actions & Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Search size={15} style={{ position: 'absolute', left: 12, color: '#94a3b8', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search logs or names..."
                  value={activitySearch}
                  onChange={e => setActivitySearch(e.target.value)}
                  style={{
                    padding: '8px 12px 8px 34px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    outline: 'none',
                    width: 200,
                    background: '#ffffff'
                  }}
                />
              </div>

              <button
                onClick={handleRefreshActivity}
                disabled={refreshing}
                title="Refresh logs"
                className="btn btn-secondary btn-sm"
                style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Filter Category Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginRight: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Filter size={13} /> Filter:
            </span>
            {[
              { id: 'all', label: 'All Activities' },
              { id: 'approval', label: 'Approvals & Rejections' },
              { id: 'booking', label: 'Booking Requests' },
              { id: 'admin', label: 'Admin Settings' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setActivityFilter(f.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 20,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  border: activityFilter === f.id ? '1px solid #2563eb' : '1px solid #e2e8f0',
                  background: activityFilter === f.id ? '#eff6ff' : '#ffffff',
                  color: activityFilter === f.id ? '#1d4ed8' : '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Activity Cards List */}
          {filteredAuditLogs.length === 0 ? (
            <div className="empty-state-box">
              <div className="empty-state-icon">
                <History size={38} strokeWidth={1.75} />
              </div>
              <div className="empty-state-text">
                {auditLogs.length === 0
                  ? 'No system activity logged yet.'
                  : 'No activity matches your search/filter criteria.'}
              </div>
              {activitySearch && (
                <button
                  onClick={() => { setActivitySearch(''); setActivityFilter('all'); }}
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: 12 }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredAuditLogs.map(log => {
                const meta = getActionMeta(log.action);
                return (
                  <div
                    key={log._id}
                    className="activity-card"
                    style={{
                      borderLeft: `4px solid ${meta.accentBorder}`
                    }}
                  >
                    {/* Extreme Left Symbol Icon Badge */}
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: meta.iconBg,
                      color: meta.iconColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <meta.Icon size={22} strokeWidth={2.2} />
                    </div>

                    {/* Middle Content: Action badge, title, performer */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                        <span
                          className="activity-badge"
                          style={{
                            background: meta.badgeBg,
                            color: meta.badgeColor,
                            borderColor: meta.badgeBorder
                          }}
                        >
                          {meta.label}
                        </span>
                        <strong style={{ fontSize: '0.94rem', color: '#0f172a', fontWeight: 700 }}>
                          {log.details}
                        </strong>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        flexWrap: 'wrap',
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <User size={13} style={{ color: '#94a3b8' }} />
                          <span>By: <strong style={{ color: '#334155' }}>{log.performedBy?.name || 'Administrator'}</strong></span>
                          {log.performedBy?.email && (
                            <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>({log.performedBy.email})</span>
                          )}
                        </div>
                        {log.performedBy?.role && (
                          <span style={{
                            fontSize: '0.7rem',
                            padding: '1px 8px',
                            borderRadius: 6,
                            background: '#f1f5f9',
                            color: '#475569',
                            fontWeight: 600,
                            letterSpacing: '0.02em'
                          }}>
                            {log.performedBy.role}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Extreme Right: Timestamp */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      flexShrink: 0,
                      gap: 4
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#475569'
                      }}>
                        <Clock size={13} style={{ color: '#94a3b8' }} />
                        <span>{formatActivityTime(log.timestamp)}</span>
                      </div>
                      <span style={{
                        fontSize: '0.72rem',
                        color: '#94a3b8',
                        background: '#f8fafc',
                        padding: '1px 7px',
                        borderRadius: 4
                      }}>
                        {getRelativeTime(log.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Subtab: Manage Halls */}
      {activeSubtab === 'halls' && (
        <div className="content-card" style={{ maxWidth: 640 }}>
          <h2 className="content-card-title">Hall Facility Settings</h2>
          {hallSaveMsg && (
            <div style={{ background: '#dcfce7', color: '#15803d', padding: '10px 14px', borderRadius: 10, marginBottom: 16 }}>
              {hallSaveMsg}
            </div>
          )}
          <form onSubmit={handleSaveHall}>
            <div className="input-group">
              <label className="input-label">Hall Name</label>
              <input type="text" disabled value="JVN Hall" className="input-field" />
            </div>
            <div className="input-group">
              <label className="input-label">Max Seating Capacity (Seats)</label>
              <input
                type="number"
                min="10"
                max="1000"
                value={hallCapacity}
                onChange={e => setHallCapacity(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Campus Location</label>
              <input
                type="text"
                value={hallLocation}
                onChange={e => setHallLocation(e.target.value)}
                className="input-field"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <input
                type="checkbox"
                id="hallActive"
                checked={hallActive}
                onChange={e => setHallActive(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              <label htmlFor="hallActive" style={{ fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600 }}>
                Active for reservation requests
              </label>
            </div>
            <button type="submit" className="btn btn-purple">
              Save Hall Configuration
            </button>
          </form>
        </div>
      )}

      {/* Subtab: Users */}
      {activeSubtab === 'users' && (
        <div className="content-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 className="content-card-title" style={{ marginBottom: 0 }}>College User Accounts</h2>
            <button onClick={() => setShowUserModal(true)} className="btn btn-primary btn-sm">
              <Plus size={16} /> Add User
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 700 }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className="badge badge-role">{u.role}</span></td>
                  <td>
                    {u.isActive ? (
                      <span className="badge badge-approved">Active</span>
                    ) : (
                      <span className="badge badge-rejected">Deactivated</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => handleToggleUser(u._id)}
                      className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-green'}`}
                      style={{ fontSize: '0.76rem', padding: '4px 10px' }}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Subtab: Clubs */}
      {activeSubtab === 'clubs' && (
        <div className="content-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 className="content-card-title" style={{ marginBottom: 0 }}>Departmental Clubs</h2>
            <button onClick={() => setShowClubModal(true)} className="btn btn-primary btn-sm">
              <Plus size={16} /> Add Club
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {clubs.map(c => (
              <div key={c._id} style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: 12, border: '1px solid #eef2f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{c.name}</h4>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>{c.department}</div>
                </div>
                <button
                  onClick={() => handleDeleteClub(c._id, c.name)}
                  className="btn btn-danger btn-sm"
                  style={{ padding: '6px 8px', borderRadius: 8 }}
                  title="Delete Club"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Add User */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 16 }}>Create User Account</h3>
            <form onSubmit={handleCreateUser}>
              <div className="input-group">
                <label className="input-label">Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input
                  type="email"
                  required
                  className="input-field"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Password</label>
                <input
                  type="password"
                  required
                  className="input-field"
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Role</label>
                <select
                  className="select-field"
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value)}
                >
                  <option value="EVENT_COORDINATOR">EVENT_COORDINATOR</option>
                  <option value="HOD">HOD</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
                <button type="button" onClick={() => setShowUserModal(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" className="btn btn-purple btn-sm">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Club */}
      {showClubModal && (
        <div className="modal-overlay" onClick={() => setShowClubModal(false)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 16 }}>Register Departmental Club</h3>
            <form onSubmit={handleCreateClub}>
              <div className="input-group">
                <label className="input-label">Club Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={newClubName}
                  onChange={e => setNewClubName(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Department</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={newClubDept}
                  onChange={e => setNewClubDept(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
                <button type="button" onClick={() => setShowClubModal(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" className="btn btn-purple btn-sm">
                  Register Club
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
